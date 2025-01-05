const { Command } = require('commander');
const { setupProgram } = require('../../../src/index');
const { deployContract } = require('../../../src/commands/deploy');
const { validateContractPath, validateNetwork, validateKeyName } = require('../../../src/utils/input-validation');
const { getCurrentNetwork, getNetworkConfig, getAvailableNetworks } = require('../../../src/utils/config');
const fs = require('fs');
const path = require('path');

jest.mock('../../../src/commands/deploy');
jest.mock('../../../src/utils/input-validation');
jest.mock('../../../src/utils/config');
jest.mock('fs');
jest.mock('path');

describe('Deploy Command', () => {
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
    validateContractPath.mockImplementation(() => {}); // Mock to do nothing
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ abi: [], bytecode: '0x1234' }));
    path.resolve.mockImplementation((_, p) => p);
  });

  it('should call deployContract with correct arguments', async () => {
    deployContract.mockResolvedValue('0x1234567890123456789012345678901234567890');
  
    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json', '-n', 'testnet', '-k', 'testkey']);
  
    expect(deployContract).toHaveBeenCalledWith(
      './TestContract.json',
      'testnet',
      'testkey'
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Contract deployed successfully'));
  });

  it('should use default network if not specified', async () => {
    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json']);
  
    expect(deployContract).toHaveBeenCalledWith(
      './TestContract.json',
      'testnet',
      'default'
    );
  });

  it('should use default key if not specified', async () => {
    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json', '-n', 'testnet']);
  
    expect(deployContract).toHaveBeenCalledWith(
      './TestContract.json',
      'testnet',
      'default'
    );
  });

  it('should handle deployment errors', async () => {
    deployContract.mockRejectedValue(new Error('Deployment failed'));

    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json']);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Deployment failed'));
  });

  it.skip('should handle non-existent contract file', async () => {
    fs.existsSync.mockReturnValue(false);
  
    await program.parseAsync(['node', 'test', 'deploy', './NonExistentContract.json']);
  
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Contract file not found'));
  });
  
  // TODO: Fix these tests and re-enable them
  it.skip('should handle invalid JSON in contract file', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('invalid JSON');
  
    await program.parseAsync(['node', 'test', 'deploy', './InvalidJSONContract.json']);
  
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid contract file'));
  });
  
  // TODO: Fix these tests and re-enable them
  it.skip('should handle missing ABI or bytecode in contract file', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ abi: [] })); // Missing bytecode
  
    await program.parseAsync(['node', 'test', 'deploy', './MissingBytecodeContract.json']);
  
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid contract file: missing ABI or bytecode'));
  });
  
  
  it.skip('should handle network configuration errors', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ abi: [], bytecode: '0x1234' }));
    getNetworkConfig.mockImplementation(() => {
      throw new Error('Network configuration not found');
    });
  
    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json', '-n', 'invalidnetwork']);
  
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Network configuration not found'));
  });

  it('should handle key management errors', async () => {
    deployContract.mockRejectedValue(new Error('Key not found'));

    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json', '-k', 'nonexistentkey']);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
  });

  // TODO: Fix these tests and re-enable them
  it.skip('should display help information when --help flag is used', async () => {
    const helpSpy = jest.spyOn(program, 'helpInformation').mockReturnValue('Mock help info');
    const outputSpy = jest.spyOn(program, 'outputHelp').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Exit called');
    });
    
    await expect(program.parseAsync(['node', 'test', 'deploy', '--help'])).rejects.toThrow('Exit called');

    expect(outputSpy).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Mock help info');

    helpSpy.mockRestore();
    outputSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should handle insufficient balance errors', async () => {
    deployContract.mockRejectedValue(new Error('Insufficient balance for gas'));

    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json']);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Insufficient balance for gas'));
  });

  it('should handle network connectivity issues', async () => {
    deployContract.mockRejectedValue(new Error('Network connection failed'));

    await program.parseAsync(['node', 'test', 'deploy', './TestContract.json']);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Network connection failed'));
  });
});