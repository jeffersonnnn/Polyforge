const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const { getKey } = require('../utils/keyManager');

async function runTests(contractPath, network, rpcUrl, keyName) {
  try {
    const fullContractPath = path.resolve(process.cwd(), contractPath);

    if (!fs.existsSync(fullContractPath)) {
      throw new Error(`Contract file not found: ${fullContractPath}`);
    }

    const contractJson = JSON.parse(fs.readFileSync(fullContractPath, 'utf8'));
    const abi = contractJson.abi;
    const bytecode = contractJson.bytecode;

    if (!abi || !bytecode) {
      throw new Error(`Invalid contract file: missing ABI or bytecode in ${fullContractPath}`);
    }

    const testFilePath = path.join(path.dirname(fullContractPath), `${path.basename(fullContractPath, '.json')}.test.js`);

    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }

    const testModule = require(testFilePath);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const privateKey = await getKey(keyName);
    const wallet = new ethers.Wallet(privateKey, provider);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log('Deploying contract for testing...');
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    console.log(`Test contract deployed at: ${await contract.getAddress()}`);

    const testResults = [];
    const testFunctions = Object.entries(testModule).filter(([, value]) => typeof value === 'function');
    for (const [testName, testFunction] of testFunctions) {
      try {
        const consoleOutput = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => consoleOutput.push(args.join(' '));

        const testTimeout = 30000; // 30 seconds
        await Promise.race([
          testFunction(contract, ethers, provider, { getKey }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test timed out')), testTimeout))
        ]);

        console.log = originalConsoleLog;

        if (consoleOutput.length === 0) {
          testResults.push({ name: testName, passed: true, noAssertions: true });
          console.log(`⚠️ ${testName} passed but had no assertions`);
        } else {
          testResults.push({ name: testName, passed: true });
          console.log(`✅ ${testName} passed`);
        }

        if (consoleOutput.length > 0) {
          console.log(`Console output for ${testName}:`);
          console.log(consoleOutput.join('\n'));
        }
      } catch (error) {
        testResults.push({ name: testName, passed: false, error: error.message });
        if (error.message === 'Test timed out') {
          console.log(`❌ ${testName} failed: Test timed out`);
        } else {
          console.log(`❌ ${testName} failed: ${error.message}`);
        }
      }
    }

    const passedTests = testResults.filter(test => test.passed).length;
    console.log(`\nTest Summary: ${passedTests}/${testResults.length} tests passed`);

    return testResults;
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    return [];
  }
}

module.exports = {
  runTests
};