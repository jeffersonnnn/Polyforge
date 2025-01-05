const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  getCurrentNetwork,
  setCurrentNetwork,
  getNetworkConfig,
  getAvailableNetworks
} = require('../../../src/utils/config');
const { ValidationError } = require('../../../src/utils/errors');

jest.mock('fs');
jest.mock('os');

describe('Config Utilities', () => {
  const mockConfigDir = '/mock/.polyforge';
  const mockConfigFile = path.join(mockConfigDir, 'config.json');
  const mockConfig = {
    currentNetwork: 'testnet',
    networks: {
      pos: { rpcUrl: 'https://polygon-rpc.com', chainId: 137 },
      amoy: { rpcUrl: 'https://rpc-amoy.polygon.technology/', chainId: 80002 },
      zkevm: { rpcUrl: 'https://zkevm-rpc.com', chainId: 1101 },
      zkevm_testnet: { rpcUrl: 'https://rpc.public.zkevm-test.net', chainId: 1442 },
      mainnet: { rpcUrl: 'https://mainnet.example.com', chainId: 1 },
      testnet: { rpcUrl: 'https://testnet.example.com', chainId: 3 }
    }
  };

  beforeEach(() => {
    os.homedir.mockReturnValue('/mock');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentNetwork', () => {
    it('should return the current network', () => {
      expect(getCurrentNetwork()).toBe('testnet');
    });

    it('should throw an error if config file is corrupted', () => {
      fs.readFileSync.mockReturnValue('invalid JSON');
      expect(() => getCurrentNetwork()).toThrow(ValidationError);
    });
  });

  describe('setCurrentNetwork', () => {
    it.skip('should set the current network', () => {
      setCurrentNetwork('mainnet');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        expect.stringContaining('"currentNetwork":"mainnet"')
      );
    });

    it('should throw an error for invalid network', () => {
      expect(() => setCurrentNetwork('invalidnet')).toThrow(ValidationError);
    });
  });

  describe('getNetworkConfig', () => {
    it('should return config for a specific network', () => {
      const config = getNetworkConfig('testnet');
      expect(config).toEqual({ rpcUrl: 'https://testnet.example.com', chainId: 3 });
    });

    it('should return all network configs when no network is specified', () => {
      const configs = getNetworkConfig();
      expect(configs).toEqual(mockConfig.networks);
    });

    it('should throw an error for invalid network', () => {
      expect(() => getNetworkConfig('invalidnet')).toThrow(ValidationError);
    });
  });

  describe('getAvailableNetworks', () => {
    it('should return a list of available networks', () => {
      const networks = getAvailableNetworks();
      expect(networks).toEqual(['pos', 'amoy', 'zkevm', 'zkevm_testnet', 'mainnet', 'testnet']);
    });
  
    it.skip('should handle case when no networks are configured', () => {
      fs.readFileSync.mockReturnValueOnce(JSON.stringify({ networks: {} }));
      const networks = getAvailableNetworks();
      expect(networks).toEqual([]);
    });
  });

  describe('Config file operations', () => {
    it.skip('should create config file if it doesn\'t exist', () => {
      fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
      getCurrentNetwork();
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockConfigFile, expect.any(String));
    });


    it('should merge user config with default config', () => {
      const userConfig = {
        currentNetwork: 'customnet',
        networks: {
          customnet: { rpcUrl: 'https://custom.example.com', chainId: 1337 }
        }
      };
      fs.readFileSync.mockReturnValue(JSON.stringify(userConfig));
      const config = getNetworkConfig();
      expect(config).toHaveProperty('pos');
      expect(config).toHaveProperty('amoy');
      expect(config).toHaveProperty('zkevm');
      expect(config).toHaveProperty('zkevm_testnet');
      expect(config).toHaveProperty('customnet');
    });
  });
});