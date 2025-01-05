const { interactWithContract } = require('../../src/commands/interact');
const { deployContract } = require('../../src/commands/deploy');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { getNetworkConfig } = require('../../src/utils/config');

jest.mock('../../src/commands/deploy');
jest.mock('ethers');
jest.mock('../../src/utils/config');
jest.mock('fs');

jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(),
  Wallet: jest.fn(),
  isAddress: jest.fn(),
  getBigInt: jest.fn(value => BigInt(value)),
  parseEther: jest.fn(),
  hexlify: jest.fn(),
}));

jest.mock('../../src/utils/config', () => ({
  getNetworkConfig: jest.fn().mockReturnValue({ rpcUrl: 'http://localhost:8545', chainId: 1337 }),
  getAvailableNetworks: jest.fn().mockReturnValue({ testnet: {}, mainnet: {} }),
}));

describe('Interact Flow Integration Tests', () => {
  const contractPath = '/mock/path/SimpleStorage.json';
  const contractAddress = '0x1234567890123456789012345678901234567890';
  const network = 'testnet';
  const keyName = 'testkey';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({
      abi: [
        { type: 'function', name: 'setValue', inputs: [{ type: 'uint256' }] },
        { type: 'function', name: 'getValue', inputs: [], outputs: [{ type: 'uint256' }] }
      ],
      bytecode: '0x123456'
    }));
    getNetworkConfig.mockReturnValue({ rpcUrl: 'http://localhost:8545', chainId: 1337 });
    deployContract.mockResolvedValue(contractAddress);
  
    ethers.isAddress.mockReturnValue(true);
    ethers.Contract.mockImplementation(() => ({
      setValue: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue() }),
      getValue: jest.fn().mockResolvedValue(42n)
    }));
  });

  it.skip('should set and get a value successfully', async () => {
    await interactWithContract(contractAddress, contractPath, 'setValue', ['42'], network, keyName);
    const result = await interactWithContract(contractAddress, contractPath, 'getValue', [], network, keyName);
    
    expect(result.toString()).toBe('42');
    expect(ethers.Contract.mock.instances[0].setValue).toHaveBeenCalledWith(42);
    expect(ethers.Contract.mock.instances[0].getValue).toHaveBeenCalled();
  });

  it('should handle non-existent methods', async () => {
    await expect(
      interactWithContract(contractAddress, contractPath, 'nonExistentMethod', [], network, keyName)
    ).rejects.toThrow();
  });

  it('should handle incorrect parameter types', async () => {
    await expect(
      interactWithContract(contractAddress, contractPath, 'setValue', ['not a number'], network, keyName)
    ).rejects.toThrow();
  });

  it('should handle network errors', async () => {
    getNetworkConfig.mockImplementation(() => { throw new Error('Network not found'); });

    await expect(
      interactWithContract(contractAddress, contractPath, 'getValue', [], 'invalidNetwork', keyName)
    ).rejects.toThrow();
  });

  it('should handle key management errors', async () => {
    const invalidKey = 'invalidKey';
    await expect(
      interactWithContract(contractAddress, contractPath, 'getValue', [], network, invalidKey)
    ).rejects.toThrow();
  });
});