# PolyForge

PolyForge is a powerful CLI tool designed for Polygon and Ethereum developers, streamlining the process of deploying, interacting with, and testing smart contracts on various networks including Polygon (PoS), zkEVM, and Ethereum testnets.

## Table of Contents

1. [Installation](#installation)
2. [Setup](#setup)
3. [Usage](#usage)
   - [Deploy](#deploy)
   - [Interact](#interact)
   - [Test](#test)
   - [Switch Network](#switch-network)
   - [Key Management](#key-management)
4. [Configuration](#configuration)
5. [Security](#security)
6. [Development](#development)
7. [Testing](#testing)
8. [Contributing](#contributing)
9. [License](#license)

## Installation

To install PolyForge, run the following command:

```bash
npm install -g polyforge
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
polyforge interact <contractAddress> ./path/to/ContractABI.json <methodName> [params...] -n network -k keyname
```

Options:
- `-n, --network <network>`: Specify the network
- `-k, --key <keyName>`: Specify the key to use for interaction

Examples:
```bash
# Read contract state
polyforge interact 0x1234...5678 ./MyToken.json balanceOf 0xabcd...efgh

# Write to contract
polyforge interact 0x1234...5678 ./MyToken.json transfer 0xabcd...efgh 1000
```

The tool will automatically wait for write transactions to be mined and confirm their success.

### Test

Run tests for a smart contract:

```bash
polyforge test ./path/to/TestContract.json -n network -k keyname
```

Options:
- `-n, --network <network>`: Specify the network
- `-k, --key <keyName>`: Specify the key to use for testing

### Switch Network

Switch between networks:

```bash
polyforge switch <network>
```

Available networks: 
- Polygon Mainnet: `pos`
- Polygon zkEVM: `zkevm`
- Polygon Amoy Testnet: `amoy`
- Polygon zkEVM Testnet: `zkevm_testnet`
- Ethereum Sepolia: `sepolia`

### Key Management

PolyForge includes a secure key management system:

```bash
# Add a new key (will prompt for the key)
polyforge key add mykey

# List all stored keys (shows only key names, not the actual keys)
polyforge key list

# Remove a key
polyforge key remove mykey
```

## Configuration

PolyForge uses a configuration file located at `~/.polyforge/config.json`. The file stores network configurations and the current network setting.

Default networks:

```json
{
  "currentNetwork": "sepolia",
  "networks": {
    "pos": {
      "rpcUrl": "https://polygon-rpc.com",
      "chainId": 137
    },
    "amoy": {
      "rpcUrl": "https://rpc-amoy.polygon.technology/",
      "chainId": 80002
    },
    "zkevm": {
      "rpcUrl": "https://zkevm-rpc.com",
      "chainId": 1101
    },
    "zkevm_testnet": {
      "rpcUrl": "https://polygon-zkevm-testnet.rpc.thirdweb.com",
      "chainId": 1442
    },
    "sepolia": {
      "rpcUrl": "https://rpc.sepolia.org",
      "chainId": 11155111
    }
  }
}
```

You can modify this file directly or use the `polyforge switch` command to change networks.

## Security

PolyForge takes security seriously:

- Private keys are never stored in plain text
- Keys are encrypted using a password you provide
- The `.env` file is not used for key storage
- Test files use mock private keys
- Configuration files with sensitive data are automatically added to `.gitignore`

## Development

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Use `npm run test` to run the test suite

## Testing

PolyForge uses Jest for testing. To run the tests:

```bash
npm run test          # Run all tests
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests only
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. When contributing, please:

1. Follow the existing code style
2. Add tests for any new functionality
3. Update documentation as needed
4. Ensure all tests pass
5. Never commit private keys or sensitive information

## License

This project is licensed under the MIT License.

