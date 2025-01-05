# PolyForge CLI Test Commands

# 1. Test configuration
echo "Testing configuration..."
node index.js config
node index.js network

# 2. Test key management
echo "Testing key management..."
node index.js key add testkey
node index.js key list
node index.js key remove testkey

# 3. Test network switching
echo "Testing network switching..."
node index.js switch pos
node index.js switch zkevm
node index.js switch zkevm_testnet

# 4. Test contract deployment
echo "Testing contract deployment..."
node index.js deploy ./TestContract.json -n pos -k mykey

# 5. Test contract interaction
echo "Testing contract interaction..."
# Replace CONTRACT_ADDRESS with the address from the deployment step
CONTRACT_ADDRESS="0x1234...5678"
node index.js interact $CONTRACT_ADDRESS ./tests/TestContract.json setValue 42
node index.js interact $CONTRACT_ADDRESS ./tests/TestContract.json getValue

# 6. Test with invalid inputs
echo "Testing error handling..."
node index.js deploy ./NonExistentContract.json
node index.js interact 0xInvalidAddress ./tests/TestContract.json getValue
node index.js switch invalidnetwork

# 7. Test help commands
echo "Testing help commands..."
node index.js --help
node index.js deploy --help
node index.js interact --help

# 8. Test contract testing
echo "Testing contract testing..."
node index.js test ./TestContract.json -n pos -k mykey