const { Command } = require('commander');
const { runTests } = require('../../../src/commands/test');
const { getCurrentNetwork, getNetworkConfig, getAvailableNetworks } = require('../../../src/utils/config');
const { ValidationError } = require('../../../src/utils/errors');
const { validateNetwork } = require('../../../src/utils/input-validation');
const fs = require('fs');
const path = require('path');
const { setupProgram } = require('../../../src/index');

jest.mock('../../../src/commands/test');
jest.mock('../../../src/utils/config');
jest.mock('../../../src/utils/input-validation');
jest.mock('fs');
jest.mock('path');

describe('Test Command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
    setupProgram(program);
    
    console.log = jest.fn();
    console.error = jest.fn();
    getCurrentNetwork.mockReturnValue('testnet');
    getNetworkConfig.mockReturnValue({ rpcUrl: 'http://testnet.example.com', chainId: 1337 });
    getAvailableNetworks.mockReturnValue(['pos', 'amoy', 'zkevm', 'zkevm_testnet']);
    validateNetwork.mockImplementation(() => {}); // Mock to do nothing
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ abi: [], bytecode: '0x1234' }));
    path.resolve.mockImplementation((_, p) => p);
    runTests.mockImplementation(async () => [{ name: 'testFunction', passed: true }]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call runTests with correct arguments', async () => {
    const mockContractPath = './TestContract.json';
    const mockNetwork = 'testnet';
    const mockKey = 'testkey';

    runTests.mockResolvedValue([{ name: 'testFunction', passed: true }]);

    await program.parseAsync(['node', 'test', 'test', mockContractPath, '-n', mockNetwork, '-k', mockKey]);

    expect(runTests).toHaveBeenCalledWith(
      expect.stringContaining(mockContractPath),
      mockNetwork,
      'http://testnet.example.com',
      mockKey
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1/1 tests passed'));
  });


  it('should use default network if not specified', async () => {
    const mockContractPath = './TestContract.json';
    const mockKey = 'testkey';

    runTests.mockResolvedValue([{ name: 'testFunction', passed: true }]);

    await program.parseAsync(['node', 'test', 'test', mockContractPath, '-k', mockKey]);

    expect(runTests).toHaveBeenCalledWith(
      expect.stringContaining(mockContractPath),
      'testnet',
      'http://testnet.example.com',
      mockKey
    );
  });

  it('should use default key if not specified', async () => {
    const mockContractPath = './TestContract.json';
    const mockNetwork = 'testnet';

    runTests.mockResolvedValue([{ name: 'testFunction', passed: true }]);

    await program.parseAsync(['node', 'test', 'test', mockContractPath, '-n', mockNetwork]);

    expect(runTests).toHaveBeenCalledWith(
      expect.stringContaining(mockContractPath),
      mockNetwork,
      'http://testnet.example.com',
      'default'
    );
  });

  it('should handle test execution errors', async () => {
    const mockError = new Error('Test execution failed');
    runTests.mockRejectedValue(mockError);

    await program.parseAsync(['node', 'test', 'test', './TestContract.json']);

    expect(console.error).toHaveBeenCalledWith(`Error: ${mockError.message}`);
  });

  it('should handle validation errors', async () => {
    runTests.mockRejectedValue(new ValidationError('Invalid contract path'));

    await program.parseAsync(['node', 'test', 'test', './InvalidContract.json']);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid contract path'));
  });

  it('should display test results correctly for mixed pass/fail', async () => {
    const testResults = [
      { name: 'test1', passed: true },
      { name: 'test2', passed: false, error: 'Test failed' },
      { name: 'test3', passed: true }
    ];
    runTests.mockResolvedValue(testResults);
  
    await program.parseAsync(['node', 'test', 'test', './TestContract.json']);
  
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ test1 passed'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ test2 failed: Test failed'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ test3 passed'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2/3 tests passed'));
  });
  
  it('should handle tests with no assertions', async () => {
    runTests.mockResolvedValue([{ name: 'emptyTest', passed: true, noAssertions: true }]);
  
    await program.parseAsync(['node', 'test', 'test', './TestContract.json']);
  
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚠️ emptyTest passed but had no assertions'));
  });
  
  it('should handle timeouts in tests', async () => {
    runTests.mockResolvedValue([{ name: 'timeoutTest', passed: false, error: 'Test timed out' }]);
  
    await program.parseAsync(['node', 'test', 'test', './TestContract.json']);
  
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ timeoutTest failed: Test timed out'));
  });
  
  it('should handle tests with console output', async () => {
    const consoleOutput = 'Test console output';
    runTests.mockResolvedValue([{ name: 'loggingTest', passed: true, consoleOutput }]);
  
    await program.parseAsync(['node', 'test', 'test', './TestContract.json']);
  
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Console output for loggingTest:'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(consoleOutput));
  });
});