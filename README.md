# PolyForge

[![npm version](https://badge.fury.io/js/polyforge.svg)](https://www.npmjs.com/package/polyforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

🛠️ A powerful CLI tool for Polygon and Ethereum developers, streamlining the process of deploying, interacting with, and testing smart contracts on various networks including Polygon (PoS), zkEVM, and Ethereum testnets.

## Features

- 🔒 Secure key management with encryption
- 🌐 Support for multiple networks (Polygon PoS, zkEVM, Ethereum)
- 📝 Simple contract deployment and interaction
- ⚡ Fast and efficient testing tools
- 🔄 Easy network switching
- ⚙️ Configurable RPC endpoints

## Requirements

- Node.js 14.x or higher
- npm 6.x or higher
- A wallet with test tokens for contract deployment

## Quick Start

```bash
# Install globally
npm install -g polyforge

# Check current network
polyforge network

# Add your private key (encrypted)
polyforge key add default

# Deploy a contract
polyforge deploy ./contracts/MyContract.json -n sepolia

# Interact with contract
polyforge interact <contract-address> ./contracts/MyContract.json getValue
```

## Documentation

- [Installation](#installation)
- [Setup](#setup)
- [Usage Guide](#usage)
  - [Contract Deployment](#deploy)
  - [Contract Interaction](#interact)
  - [Testing](#test)
  - [Network Management](#switch-network)
  - [Key Management](#key-management)
- [Configuration](#configuration)
- [Security](#security)

## Installation

```bash
npm install -g polyforge
```

To update an existing installation:

```bash
npm update -g polyforge
```

To verify the installation:

```bash
polyforge --version
```

## Setup

After installation, you need to set up your configuration and add your private keys:

1. Run `polyforge network` to view your current network configuration.
2. Add your private key:
   ```bash
   polyforge key add default
   ```
   You will be prompted to enter your private key securely. The key will be encrypted and stored safely.

> **Important**: Never share or commit your private keys. The key management system securely encrypts your keys.

## Usage

### Deploy

Deploy a smart contract to the network:

```bash
polyforge deploy ./path/to/YourContract.json -n network -k keyname
```

Options:
- `-n, --network <network>`: Specify the network (pos, amoy, zkevm, zkevm_testnet, sepolia)
- `-k, --key <keyName>`: Specify the key to use for deployment (default: "default")

Example:
```bash
polyforge deploy ./contracts/MyToken.json -n sepolia -k default
```

### Interact

Interact with a deployed contract:

```bash
polyforge interact <contractAddress> ./path/to/ContractABI.json <methodName> [params...]
```

Examples:
```bash
# Read contract state
polyforge interact 0x1234...5678 ./MyToken.json balanceOf 0xabcd...efgh

# Write to contract
polyforge interact 0x1234...5678 ./MyToken.json transfer 0xabcd...efgh 1000
```

The tool will automatically wait for write transactions to be mined and confirm their success.

### Networks

Available networks: 
- Polygon Mainnet: `pos`
- Polygon zkEVM: `zkevm`
- Polygon Amoy Testnet: `amoy`
- Polygon zkEVM Testnet: `zkevm_testnet`
- Ethereum Sepolia: `sepolia`

Switch networks using:
```bash
polyforge switch <network>
```

## Configuration

Configuration file location: `~/.polyforge/config.json`

Default RPC endpoints are provided, but you can customize them:

```json
{
  "currentNetwork": "sepolia",
  "networks": {
    "sepolia": {
      "rpcUrl": "https://rpc.sepolia.org",
      "chainId": 11155111
    }
  }
}
```

## Security

PolyForge takes security seriously:

- 🔐 Private keys are never stored in plain text
- 🔑 Keys are encrypted with a password you provide
- 📝 No sensitive data in environment files
- ✅ Automatic gitignore for sensitive files

## Support

- [GitHub Issues](https://github.com/yourusername/polyforge/issues)
- [Documentation](https://github.com/yourusername/polyforge#documentation)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Your Name]

