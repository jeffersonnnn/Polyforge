const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { storeKey, getKey, listKeys, removeKey } = require('../../../src/utils/keyManager');
const { KeyManagementError } = require('../../../src/utils/errors');

jest.mock('fs');
jest.mock('crypto');
jest.mock('readline');

describe('Key Manager', () => {
  const mockKeysFile = path.join(process.env.HOME, '.polyforge', 'keys.json');
  const mockPassword = 'testpassword';
  const mockPrivateKey = '0x1234567890abcdef';
  const mockEncryptedKey = 'iv:encryptedData';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HOME = '/mock/home';
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ testKey: mockEncryptedKey }));
    crypto.randomBytes.mockReturnValue(Buffer.from('mockiv'));
    crypto.scryptSync.mockReturnValue(Buffer.from('mockkey'));
    crypto.createCipheriv.mockReturnValue({
      update: jest.fn().mockReturnValue('encrypted'),
      final: jest.fn().mockReturnValue('Data')
    });
    crypto.createDecipheriv.mockReturnValue({
      update: jest.fn().mockReturnValue('decrypted'),
      final: jest.fn().mockReturnValue('Key')
    });

    // Mock the readline interface
    const mockReadline = {
      question: jest.fn().mockImplementation((query, callback) => callback(mockPassword)),
      close: jest.fn()
    };
    require('readline').createInterface.mockReturnValue(mockReadline);
  });

  describe('storeKey', () => {
    it('should store a key successfully', async () => {
      await storeKey('newKey', mockPrivateKey);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockKeysFile,
        expect.stringContaining('"newKey"')
      );
    });

    it('should throw an error if encryption fails', async () => {
      crypto.createCipheriv.mockImplementation(() => { throw new Error('Encryption failed'); });
      await expect(storeKey('newKey', mockPrivateKey)).rejects.toThrow('Encryption failed');
    });
  });

  describe('getKey', () => {
    it('should retrieve a key successfully', async () => {
      const key = await getKey('testKey');
      expect(key).toBe('decryptedKey');
    });

    it('should throw a KeyManagementError if key is not found', async () => {
      await expect(getKey('nonExistentKey')).rejects.toThrow(KeyManagementError);
    });

    it('should throw a KeyManagementError if decryption fails', async () => {
      crypto.createDecipheriv.mockImplementation(() => { throw new Error('Decryption failed'); });
      await expect(getKey('testKey')).rejects.toThrow(KeyManagementError);
    });
  });

  describe('listKeys', () => {
    it('should list available keys', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      listKeys();
      expect(consoleSpy).toHaveBeenCalledWith('Available keys:');
      expect(consoleSpy).toHaveBeenCalledWith('- testKey');
      consoleSpy.mockRestore();
    });

    it('should handle case when no keys are found', () => {
      fs.existsSync.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log');
      listKeys();
      expect(consoleSpy).toHaveBeenCalledWith('No keys found.');
      consoleSpy.mockRestore();
    });
  });

  describe('removeKey', () => {
    it('should remove a key successfully', () => {
      removeKey('testKey');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockKeysFile,
        expect.not.stringContaining('"testKey"')
      );
    });

    it('should throw a KeyManagementError if key is not found', () => {
      expect(() => removeKey('nonExistentKey')).toThrow(KeyManagementError);
    });
  });
});