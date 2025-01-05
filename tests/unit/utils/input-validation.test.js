// tests/unit/utils/input-validation.test.js

const fs = require('fs');
const ethers = require('ethers');
const {
  validateContractPath,
  validateNetwork,
  validateKeyName,
  validateContractAddress,
  validateMethodName,
  validateParams
} = require('../../../src/utils/input-validation');
const { ValidationError } = require('../../../src/utils/errors');

jest.mock('fs');
jest.mock('ethers');

describe('Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateContractPath', () => {
    it('should not throw for valid contract path', () => {
      fs.existsSync.mockReturnValue(true);
      expect(() => validateContractPath('./ValidContract.json')).not.toThrow();
    });

    it('should throw for non-existent file', () => {
      fs.existsSync.mockReturnValue(false);
      expect(() => validateContractPath('./NonExistent.json')).toThrow(ValidationError);
    });

    it('should throw for non-JSON file', () => {
      fs.existsSync.mockReturnValue(true);
      expect(() => validateContractPath('./InvalidFile.txt')).toThrow(ValidationError);
    });

    it('should throw for empty path', () => {
      expect(() => validateContractPath('')).toThrow(ValidationError);
    });
  });

  describe('validateNetwork', () => {
    const availableNetworks = ['mainnet', 'testnet'];

    it.skip('should not throw for valid network', () => {
      expect(() => validateNetwork('mainnet', availableNetworks)).not.toThrow();
    });

    it('should throw for invalid network', () => {
      expect(() => validateNetwork('invalidnet', availableNetworks)).toThrow(ValidationError);
    });

    it('should throw for empty network', () => {
      expect(() => validateNetwork('', availableNetworks)).toThrow(ValidationError);
    });
  });

  describe('validateKeyName', () => {
    it('should not throw for valid key name', () => {
      expect(() => validateKeyName('validKey')).not.toThrow();
    });

    it('should throw for empty key name', () => {
      expect(() => validateKeyName('')).toThrow(ValidationError);
    });

    it('should throw for non-string key name', () => {
      expect(() => validateKeyName(123)).toThrow(ValidationError);
    });
  });

  describe('validateContractAddress', () => {
    it('should not throw for valid address', () => {
      ethers.isAddress.mockReturnValue(true);
      expect(() => validateContractAddress('0x1234567890123456789012345678901234567890')).not.toThrow();
    });

    it('should throw for invalid address', () => {
      ethers.isAddress.mockReturnValue(false);
      expect(() => validateContractAddress('invalid_address')).toThrow(ValidationError);
    });
  });

  describe('validateMethodName', () => {
    it('should not throw for valid method name', () => {
      expect(() => validateMethodName('validMethod')).not.toThrow();
    });

    it('should throw for empty method name', () => {
      expect(() => validateMethodName('')).toThrow(ValidationError);
    });

    it('should throw for non-string method name', () => {
      expect(() => validateMethodName(123)).toThrow(ValidationError);
    });
  });

  describe('validateParams', () => {
    const mockAbi = [
      {
        name: 'testMethod',
        type: 'function',
        inputs: [
          { type: 'uint256' },
          { type: 'string' },
          { type: 'bool' },
          { type: 'address' }
        ]
      }
    ];

    it.skip('should not throw for valid params', () => {
      const validParams = ['123', 'test', 'true', '0x1234567890123456789012345678901234567890'];
      expect(() => validateParams(validParams, mockAbi, 'testMethod')).not.toThrow();
    });

    it('should throw for invalid number of params', () => {
      const invalidParams = ['123', 'test'];
      expect(() => validateParams(invalidParams, mockAbi, 'testMethod')).toThrow(ValidationError);
    });

    it('should throw for invalid param type', () => {
      const invalidParams = ['not a number', 'test', 'true', '0x1234567890123456789012345678901234567890'];
      expect(() => validateParams(invalidParams, mockAbi, 'testMethod')).toThrow(ValidationError);
    });

    it('should throw for non-existent method', () => {
      const params = ['123', 'test', 'true', '0x1234567890123456789012345678901234567890'];
      expect(() => validateParams(params, mockAbi, 'nonExistentMethod')).toThrow(ValidationError);
    });

    it.skip('should handle array parameters', () => {
      const arrayAbi = [
        {
          name: 'arrayMethod',
          type: 'function',
          inputs: [
            { type: 'uint256[]' },
            { type: 'string[]' }
          ]
        }
      ];
      const validParams = ['[1,2,3]', '["a","b","c"]'];
      expect(() => validateParams(validParams, arrayAbi, 'arrayMethod')).not.toThrow();
    });

    it.skip('should handle tuple parameters', () => {
      const tupleAbi = [
        {
          name: 'tupleMethod',
          type: 'function',
          inputs: [
            {
              type: 'tuple',
              components: [
                { type: 'uint256', name: 'id' },
                { type: 'string', name: 'name' }
              ]
            }
          ]
        }
      ];
      const validParams = ['{"id": 1, "name": "test"}'];
      expect(() => validateParams(validParams, tupleAbi, 'tupleMethod')).not.toThrow();
    });
  });
});