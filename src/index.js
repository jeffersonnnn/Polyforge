#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { getCurrentNetwork, setCurrentNetwork, getNetworkConfig, getAvailableNetworks } = require('./utils/config');
const { deployContract } = require('./commands/deploy');
const { interactWithContract } = require('./commands/interact');
const { storeKey, removeKey, listKeys } = require('./utils/keyManager');
const { runTests } = require('./commands/test');
const { 
  validateContractPath, 
  validateNetwork, 
  validateKeyName, 
  validateContractAddress, 
  validateMethodName 
} = require('./utils/input-validation');

const program = new Command();

function setupProgram(prog) {
  prog
    .version('0.1.0')
    .description('PolyForge - A CLI tool for Polygon developers');

  prog.addCommand(createTestCommand());

  prog
    .command('deploy <contractPath>')
    .description('Deploy a smart contract to Polygon')
    .option('-n, --network <network>', 'Specify the Polygon network (pos, amoy, zkevm, zkevm_testnet)')
    .option('-k, --key <keyName>', 'Specify the key to use for deployment')
    .action(async (contractPath, options) => {
      try {
        console.log('Network option:', options.network);
        validateContractPath(contractPath);
        const network = options.network || getCurrentNetwork();
        console.log('Network being used:', network);
        
        const availableNetworks = getAvailableNetworks();
        console.log('Available networks:', availableNetworks);
        
        validateNetwork(network, availableNetworks);
        const keyName = options.key || 'default';
        validateKeyName(keyName);
        
        console.log(`Deploying ${contractPath} to ${network}...`);
        
        const deployedAddress = await deployContract(contractPath, network, keyName);
        console.log(`Contract deployed successfully to address: ${deployedAddress}`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  prog
    .command('interact <contractAddress> <abiPath> <methodName> [params...]')
    .description('Interact with a deployed contract')
    .option('-n, --network <network>', 'Specify the Polygon network (pos, amoy, zkevm, zkevm_testnet)')
    .option('-k, --key <keyName>', 'Specify the key to use for interaction')
    .action(async (contractAddress, abiPath, methodName, params, options) => {
      try {
        validateContractAddress(contractAddress);
        validateContractPath(abiPath);
        validateMethodName(methodName);
        const network = options.network || getCurrentNetwork();
        const availableNetworks = getAvailableNetworks();
        validateNetwork(network, availableNetworks);
        const keyName = options.key || 'default';
        validateKeyName(keyName);

        const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const abi = contractJson.abi;
        const methodAbi = abi.find(item => item.name === methodName && item.type === 'function');

        if (methodAbi && methodAbi.stateMutability === 'payable') {
          console.log('This is a payable function. You can send MATIC by adding the amount as the last parameter.');
          if (params.length === 0 || isNaN(parseFloat(params[params.length - 1]))) {
            console.log('No MATIC amount specified. Defaulting to 0 MATIC.');
            params.push('0');
          }
        }

        params = params.map(param => {
          try {
            return JSON.parse(param);
          } catch {
            return param;
          }
        });

        console.log(`Interacting with ${contractAddress}.${methodName} on ${network}...`);
        const result = await interactWithContract(contractAddress, abiPath, methodName, params, network, keyName);
        console.log('Result:', result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  prog
    .command('test <contractPath>')
    .description('Run tests for a smart contract')
    .option('-n, --network <network>', 'Specify the Polygon network (pos, amoy, zkevm, zkevm_testnet)')
    .option('-k, --key <keyName>', 'Specify the key to use for testing')
    .action(async (contractPath, options) => {
      try {
        validateContractPath(contractPath);
        const network = options.network || getCurrentNetwork();
        const availableNetworks = getAvailableNetworks();
        validateNetwork(network, availableNetworks);
        const networkConfig = getNetworkConfig(network);
        const keyName = options.key || 'default';
        validateKeyName(keyName);

        const fullContractPath = path.resolve(process.cwd(), contractPath);

        console.log(`Running tests for ${fullContractPath} on ${network}...`);
        console.log(`Using network RPC: ${networkConfig.rpcUrl}`);
        console.log(`Using key: ${keyName}`);

        await runTests(fullContractPath, network, networkConfig.rpcUrl, keyName);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  prog
    .command('switch <network>')
    .description('Switch between Polygon networks')
    .action((network) => {
      try {
        const availableNetworks = getAvailableNetworks();
        validateNetwork(network, availableNetworks);
        setCurrentNetwork(network);
        console.log(`Successfully switched to ${network} network.`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  prog
    .command('network')
    .description('Display current network')
    .action(() => {
      try {
        const currentNetwork = getCurrentNetwork();
        const networkConfig = getNetworkConfig(currentNetwork);
        console.log(`Current network: ${currentNetwork}`);
        console.log(`RPC URL: ${networkConfig.rpcUrl}`);
        console.log(`Chain ID: ${networkConfig.chainId}`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  prog
    .command('config')
    .description('Display current configuration')
    .action(() => {
      try {
        const currentNetwork = getCurrentNetwork();
        const networkConfig = getNetworkConfig(currentNetwork);
        console.log('Current configuration:');
        console.log(`Network: ${currentNetwork}`);
        console.log(`RPC URL: ${networkConfig.rpcUrl}`);
        console.log(`Chain ID: ${networkConfig.chainId}`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  prog
    .command('key <action> [name]')
    .description('Manage keys (add, remove, list)')
    .action(async (action, name) => {
      try {
        switch (action) {
          case 'add':
            if (!name) {
              throw new Error('Key name is required for adding a key.');
            }
            validateKeyName(name);
            const rl = require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            });
            rl.question('Enter your private key: ', async (privateKey) => {
              rl.close();
              await storeKey(name, privateKey);
              console.log(`Key '${name}' added successfully.`);
            });
            break;
          case 'remove':
            if (!name) {
              throw new Error('Key name is required for removing a key.');
            }
            validateKeyName(name);
            await removeKey(name);
            console.log(`Key '${name}' removed successfully.`);
            break;
          case 'list':
            listKeys();
            break;
          default:
            throw new Error('Invalid action. Use "add", "remove", or "list".');
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });

  return prog;
}

// Add this function to your index.js file
function createTestCommand() {
  return new Command('test')
    .description('Run tests for a smart contract')
    .argument('<contractPath>', 'Path to the contract file')
    .option('-n, --network <network>', 'Specify the Polygon network (pos, amoy, zkevm, zkevm_testnet)')
    .option('-k, --key <keyName>', 'Specify the key to use for testing')
    .action(async (contractPath, options) => {
      try {
        validateContractPath(contractPath);
        const network = options.network || getCurrentNetwork();
        const availableNetworks = getAvailableNetworks();
        validateNetwork(network, availableNetworks);
        const networkConfig = getNetworkConfig(network);
        const keyName = options.key || 'default';
        validateKeyName(keyName);

        const fullContractPath = path.resolve(process.cwd(), contractPath);

        console.log(`Running tests for ${fullContractPath} on ${network}...`);
        console.log(`Using network RPC: ${networkConfig.rpcUrl}`);
        console.log(`Using key: ${keyName}`);

        const testResults = await runTests(fullContractPath, network, networkConfig.rpcUrl, keyName);
        
        testResults.forEach(result => {
          if (result.passed) {
            if (result.noAssertions) {
              console.log(`⚠️ ${result.name} passed but had no assertions`);
            } else {
              console.log(`✅ ${result.name} passed`);
            }
          } else {
            console.log(`❌ ${result.name} failed: ${result.error}`);
          }
          if (result.consoleOutput) {
            console.log(`Console output for ${result.name}:`);
            console.log(result.consoleOutput);
          }
        });

        const passedTests = testResults.filter(test => test.passed).length;
        const totalTests = testResults.length;
        
        console.log(`\n${passedTests}/${totalTests} tests passed`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    });
}

if (require.main === module) {
  setupProgram(program).parse(process.argv);
}

module.exports = { setupProgram, createTestCommand };