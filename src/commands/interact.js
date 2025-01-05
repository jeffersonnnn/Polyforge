const fs = require('fs');
const { ethers } = require('ethers');
const { getKey } = require('../utils/keyManager');
const { getNetworkConfig } = require('../utils/config');
const { 
  validateContractAddress, 
  validateMethodName, 
  validateParams,
  validateNetwork,
  validateKeyName
} = require('../utils/input-validation');
const { NetworkError, ContractError, ValidationError } = require('../utils/errors');


async function interactWithContract(contractAddress, abiPath, methodName, params, network, keyName) {
  try {
    validateContractAddress(contractAddress);
    validateMethodName(methodName);
    validateNetwork(network, Object.keys(getNetworkConfig()));
    validateKeyName(keyName);

    // Read the full contract ABI
    const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const abi = contractJson.abi;

    // Find the specific method in the ABI
    const methodAbi = abi.find(item => item.name === methodName && item.type === 'function');
    if (!methodAbi) {
      throw new ContractError(`Method '${methodName}' not found in the contract ABI.`);
    }

    // Validate the parameters against the full method ABI
    validateParams(params, [methodAbi], methodName);

    // Get network configuration
    const networkConfig = getNetworkConfig(network);

    // Connect to the network
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    // Get the private key securely
    const privateKey = await getKey(keyName);

    const wallet = new ethers.Wallet(privateKey, provider);

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    // Prepare the parameters
    const parsedParams = parseParams(methodAbi.inputs, params);

    // Determine if the function is payable
    const isPayable = methodAbi.stateMutability === 'payable';

    // Call the contract method
    let result;
    if (isPayable) {
      const options = { value: ethers.parseEther(parsedParams.pop()) };
      result = await contract[methodName](...parsedParams, options);
    } else {
      result = await contract[methodName](...parsedParams);
    }

    // Wait for the transaction to be mined if it's not a view function
    if (methodAbi.stateMutability !== 'view' && methodAbi.stateMutability !== 'pure') {
      await result.wait();
      return `Transaction successful. Transaction hash: ${result.hash}`;
    }

    return formatResult(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    } else if (error instanceof NetworkError) {
      throw error;
    } else if (error instanceof ContractError) {
      throw error;
    } else {
      console.error('Interaction error details:', error);
      throw new ContractError(`Interaction failed: ${error.message}`);
    }
  }
}

function parseParams(inputs, params) {
  return inputs.map((input, index) => {
    const param = params[index];
    try {
      switch (input.type) {
        case 'tuple':
        case 'tuple[]':
        case 'uint256[]':
        case 'int256[]':
        case 'bool[]':
        case 'address[]':
        case 'bytes[]':
          return parseComplexParam(param);
        case 'uint256':
        case 'int256':
          return ethers.getBigInt(param);
        case 'bool':
          return param.toLowerCase() === 'true';
        case 'address':
          return param;
        case 'string':
          return param;
        case 'bytes':
          return ethers.hexlify(param);
        default:
          if (input.type.includes('[]')) {
            return parseComplexParam(param);
          }
          return param;
      }
    } catch (error) {
      throw new ValidationError(`Failed to parse parameter ${index + 1}: ${error.message}`);
    }
  });
}

function formatResult(result) {
  if (typeof result === 'bigint') {
    return result.toString();
  }
  if (Array.isArray(result)) {
    return result.map(formatResult);
  }
  if (typeof result === 'object' && result !== null) {
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [key, formatResult(value)])
    );
  }
  return result;
}

module.exports = {
  interactWithContract,
};