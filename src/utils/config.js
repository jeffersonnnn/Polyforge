const fs = require('fs');
const path = require('path');
const os = require('os');
const { ValidationError } = require('./errors');

const CONFIG_DIR = path.join(os.homedir(), '.polyforge');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const defaultConfig = {
  currentNetwork: 'pos',
  networks: {
    pos: {
      rpcUrl: 'https://polygon-rpc.com',
      chainId: 137,
    },
    amoy: {
      rpcUrl: 'https://rpc-amoy.polygon.technology/',
      chainId: 80002,
    },
    zkevm: {
      rpcUrl: 'https://zkevm-rpc.com',
      chainId: 1101,
    },
    zkevm_testnet: {
      rpcUrl: 'https://polygon-zkevm-testnet.rpc.ankr.com',
      chainId: 1442,
    },
    sepolia: {
      rpcUrl: 'https://rpc.sepolia.org',
      chainId: 11155111,
    }
  },
};

function validateConfig(config) {
  if (typeof config !== 'object' || config === null) {
    throw new ValidationError('Config must be an object');
  }

  if (typeof config.currentNetwork !== 'string') {
    throw new ValidationError('currentNetwork must be a string');
  }

  if (typeof config.networks !== 'object' || config.networks === null) {
    throw new ValidationError('networks must be an object');
  }

  for (const [network, networkConfig] of Object.entries(config.networks)) {
    if (typeof networkConfig !== 'object' || networkConfig === null) {
      throw new ValidationError(`Network config for ${network} must be an object`);
    }

    if (typeof networkConfig.rpcUrl !== 'string') {
      throw new ValidationError(`rpcUrl for ${network} must be a string`);
    }

    if (typeof networkConfig.chainId !== 'number' || !Number.isInteger(networkConfig.chainId)) {
      throw new ValidationError(`chainId for ${network} must be an integer`);
    }
  }

  if (!config.networks[config.currentNetwork]) {
    throw new ValidationError(`Current network "${config.currentNetwork}" is not defined in the networks list`);
  }
}

function ensureConfigExists() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

function readConfig() {
  ensureConfigExists();
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const userConfig = JSON.parse(configData);
    
    // Merge user config with default config to ensure all networks are available
    const mergedConfig = {
      ...defaultConfig,
      ...userConfig,
      networks: {
        ...defaultConfig.networks,
        ...userConfig.networks
      }
    };
    
    validateConfig(mergedConfig);
    return mergedConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Config file is corrupted and cannot be parsed');
    }
    throw error;
  }
}

function writeConfig(config) {
  ensureConfigExists();
  validateConfig(config);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getCurrentNetwork() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig.currentNetwork;
  }

  const config = readConfig();
  return config.currentNetwork;
}

function setCurrentNetwork(network) {
  const config = readConfig();
  if (config.networks[network]) {
    config.currentNetwork = network;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('Network switched to:', network);
  } else {
    throw new ValidationError(`Network "${network}" is not configured.`);
  }
}

function getNetworkConfig(network) {
  const config = readConfig();
  if (!network) {
    return config.networks;
  }
  if (!config.networks[network]) {
    throw new ValidationError(`Network "${network}" is not configured.`);
  }
  return config.networks[network];
}

function getAvailableNetworks() {
  const config = readConfig();
  return Object.keys(config.networks || {});
}

module.exports = {
  getCurrentNetwork,
  setCurrentNetwork,
  getNetworkConfig,
  getAvailableNetworks,
};