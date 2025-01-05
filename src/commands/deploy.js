const fs = require('fs');
const { ethers } = require('ethers');
const { getKey } = require('../utils/keyManager');
const { getNetworkConfig, getAvailableNetworks } = require('../utils/config');
const { validateContractPath, validateNetwork, validateKeyName } = require('../utils/input-validation');

async function deployContract(contractPath, network, keyName) {
  try {
    console.log('deployContract called with:', { contractPath, network, keyName }); // Debug log
    validateContractPath(contractPath);
    validateNetwork(network, getAvailableNetworks());
    validateKeyName(keyName);

    // Read the contract ABI and bytecode
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const abi = contractJson.abi;
    const bytecode = contractJson.bytecode;

    if (!abi || !bytecode) {
      throw new Error('Invalid contract file: missing ABI or bytecode');
    }

    // Get network configuration
    console.log('Getting network config for:', network); // Debug log
    const networkConfig = getNetworkConfig(network);
    console.log('Network config:', networkConfig); // Debug log

    // Connect to the network
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    console.log('Connected to network:', network); // Debug log

    // Get the private key securely
    const privateKey = await getKey(keyName);
    console.log('Retrieved private key for:', keyName); // Debug log (don't log the actual key)

    const wallet = new ethers.Wallet(privateKey, provider);

    // Create a factory for the contract
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    // Get the current fee data
    const feeData = await provider.getFeeData();
    console.log('Fee data:', feeData); // Debug log

    // Deploy the contract with explicit gas settings
    console.log('Deploying contract...');
    const contract = await factory.deploy({
      gasLimit: 3000000,
      maxFeePerGas: feeData.maxFeePerGas || ethers.parseUnits('100', 'gwei'),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.parseUnits('1', 'gwei')
    });

    // Wait for the contract to be deployed
    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();
    console.log('Contract deployed at:', deployedAddress); // Debug log

    return deployedAddress;
  } catch (error) {
    console.error('Deployment error details:', error);
    if (error.message.includes('ENOENT')) {
      console.error('Contract file not found');
    } else if (error.message.includes('Unexpected token')) {
      console.error('Invalid contract file');
    } else if (error.message.includes('missing ABI or bytecode')) {
      console.error('Invalid contract file: missing ABI or bytecode');
    } else if (error.message.includes('Network configuration not found')) {
      console.error('Network configuration not found');
    } else {
      console.error(`Deployment failed: ${error.message}`);
    }
    throw error;
  }
}

module.exports = {
  deployContract,
};