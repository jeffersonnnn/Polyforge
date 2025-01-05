const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Mock modules
jest.mock('ethers');
jest.mock('fs');
jest.mock('path');

// Mock console methods to prevent noise in test output
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup global mocks for commonly used functions
global.getKey = jest.fn().mockResolvedValue('0x1234567890abcdef');
global.getCurrentNetwork = jest.fn().mockReturnValue('testnet');
global.getNetworkConfig = jest.fn().mockReturnValue({
  rpcUrl: 'https://testnet.example.com',
  chainId: 1337
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});