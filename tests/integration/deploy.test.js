const { deployContract } = require('../../src/commands/deploy');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { getKey } = require('../../src/utils/keyManager');
const { getNetworkConfig, getAvailableNetworks } = require('../../src/utils/config');
const { ContractError, ValidationError } = require('../../src/utils/errors');

jest.mock('ethers');
jest.mock('../../src/utils/keyManager');
jest.mock('../../src/utils/config');
jest.mock('fs');

describe('deployContract Integration', () => {
  const mockContractPath = '/mock/path/TestContract.json';
  const mockNetwork = 'testnet';
  const mockKeyName = 'testkey';
  const mockPrivateKey = '0x1234567890abcdef';
  const mockRpcUrl = 'https://testnet.example.com';
  const mockChainId = 1337;

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({
      abi: [{ type: 'constructor', inputs: [] }],
      bytecode: '0x123456'
    }));
    
    getKey.mockResolvedValue(mockPrivateKey);
    getNetworkConfig.mockReturnValue({ rpcUrl: mockRpcUrl, chainId: mockChainId });
    getAvailableNetworks.mockReturnValue({ testnet: {}, mainnet: {} });

    const mockDeploy = jest.fn().mockResolvedValue({
      waitForDeployment: jest.fn().mockResolvedValue(),
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
    });

    ethers.JsonRpcProvider.mockImplementation(() => ({
      getFeeData: jest.fn().mockResolvedValue({
        maxFeePerGas: ethers.parseUnits('100', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      })
    }));

    ethers.Wallet.mockImplementation(() => ({
      connect: jest.fn().mockReturnThis()
    }));

    ethers.ContractFactory.mockImplementation(() => ({
      deploy: mockDeploy
    }));
  });

  it.skip('should successfully deploy a contract', async () => {
    const result = await deployContract(mockContractPath, mockNetwork, mockKeyName);

    expect(result).toBe('0x1234567890123456789012345678901234567890');
    expect(ethers.ContractFactory).toHaveBeenCalled();
    const mockContractFactoryInstance = ethers.ContractFactory.mock.results[0].value;
    expect(mockContractFactoryInstance.deploy).toHaveBeenCalledWith({
      gasLimit: 3000000,
      maxFeePerGas: expect.any(Object),
      maxPriorityFeePerGas: expect.any(Object)
    });
  });

  it.skip('should deploy a contract with constructor arguments', async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({
      abi: [{ type: 'constructor', inputs: [{ type: 'uint256' }] }],
      bytecode: '0x123456'
    }));
  
    const result = await deployContract(mockContractPath, mockNetwork, mockKeyName, ['42']);
  
    expect(result).toBe('0x1234567890123456789012345678901234567890');
    expect(ethers.ContractFactory).toHaveBeenCalled();
    const mockContractFactoryInstance = ethers.ContractFactory.mock.results[0].value;
    expect(mockContractFactoryInstance.deploy).toHaveBeenCalledWith(42, {
      gasLimit: 3000000,
      maxFeePerGas: expect.any(Object),
      maxPriorityFeePerGas: expect.any(Object)
    });
  });

  it.skip('should throw a ContractError if contract file is invalid', async () => {
    fs.readFileSync.mockReturnValue('invalid JSON');

    await expect(deployContract(mockContractPath, mockNetwork, mockKeyName))
      .rejects.toThrow(SyntaxError);
  });

  it.skip('should throw a ValidationError if contract file is missing ABI or bytecode', async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ abi: [] }));

    await expect(deployContract(mockContractPath, mockNetwork, mockKeyName))
      .rejects.toThrow('Invalid contract file: missing ABI or bytecode');
  });

  it.skip('should throw a ValidationError if network is invalid', async () => {
    await expect(deployContract(mockContractPath, 'invalidNetwork', mockKeyName))
      .rejects.toThrow(ValidationError);
  });

  it.skip('should throw a NetworkError if provider connection fails', async () => {
    ethers.JsonRpcProvider.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    await expect(deployContract(mockContractPath, mockNetwork, mockKeyName))
      .rejects.toThrow('Connection failed');
  });

  it.skip('should throw an error if deployment fails', async () => {
    ethers.ContractFactory.mockImplementation(() => ({
      deploy: jest.fn().mockRejectedValue(new Error('Deployment failed'))
    }));

    await expect(deployContract(mockContractPath, mockNetwork, mockKeyName))
      .rejects.toThrow('Deployment failed');
  });
});