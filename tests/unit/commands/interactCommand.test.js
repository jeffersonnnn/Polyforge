const { Command } = require('commander');
const { interactWithContract } = require('../../../src/commands/interact');
const { getCurrentNetwork } = require('../../../src/utils/config');
const { ValidationError } = require('../../../src/utils/errors');
const { setupProgram } = require('../../../src/index');

jest.mock('../../../src/commands/interact');  
jest.mock('../../../src/utils/config');

jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(),
  Wallet: jest.fn(),
  isAddress: jest.fn(),
  getBigInt: jest.fn(value => BigInt(value)),
  parseEther: jest.fn(),
  hexlify: jest.fn(),
  BigNumber: {
    from: jest.fn(value => ({ toString: () => value.toString() }))
  }
}));

describe('Interact Command', () => {
  let program;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    program = new Command();
    setupProgram(program);
    console.log = jest.fn();
    console.error = jest.fn();
    getCurrentNetwork.mockReturnValue('testnet');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it.skip('should call interactWithContract with correct arguments', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'testMethod';
    const mockParams = ['param1', 'param2'];
    const mockNetwork = 'testnet';
    const mockKey = 'testkey';

    interactWithContract.mockResolvedValue('Success');

    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      ...mockParams, 
      '-n', mockNetwork, 
      '-k', mockKey
    ]);

    expect(interactWithContract).toHaveBeenCalledWith(
      mockAddress, mockAbiPath, mockMethod, mockParams, mockNetwork, mockKey
    );
    expect(console.log).toHaveBeenCalledWith('Result: Success');
  });

  it.skip('should use default network if not specified', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'testMethod';
    const mockKey = 'testkey';

    interactWithContract.mockResolvedValue('Success');

    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      '-k', mockKey
    ]);

    expect(interactWithContract).toHaveBeenCalledWith(
      mockAddress, mockAbiPath, mockMethod, [], 'testnet', mockKey
    );
  });

  it.skip('should use default key if not specified', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'testMethod';
    const mockNetwork = 'testnet';

    interactWithContract.mockResolvedValue('Success');

    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      '-n', mockNetwork
    ]);

    expect(interactWithContract).toHaveBeenCalledWith(
      mockAddress, mockAbiPath, mockMethod, [], mockNetwork, 'default'
    );
  });

  it.skip('should handle interaction errors', async () => {
    const mockError = new Error('Interaction failed');
    interactWithContract.mockRejectedValue(mockError);

    await program.parseAsync([
      'node', 'test', 'interact', 
      '0x1234567890123456789012345678901234567890', 
      './TestContract.json', 
      'testMethod'
    ]);

    expect(console.error).toHaveBeenCalledWith(`Error: ${mockError.message}`);
  });

  it('should handle validation errors', async () => {
    interactWithContract.mockRejectedValue(new ValidationError('Invalid contract address'));

    await program.parseAsync([
      'node', 'test', 'interact', 
      'invalidAddress', 
      './TestContract.json', 
      'testMethod'
    ]);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid contract address'));
  });

  it.skip('should parse complex parameters correctly', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'complexMethod';
    const mockParams = ['[1,2,3]', '{"key":"value"}', 'true'];
    const mockNetwork = 'testnet';
    const mockKey = 'testkey';

    interactWithContract.mockResolvedValue('Success');

    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      ...mockParams, 
      '-n', mockNetwork, 
      '-k', mockKey
    ]);

    expect(interactWithContract).toHaveBeenCalledWith(
      mockAddress, mockAbiPath, mockMethod, mockParams, mockNetwork, mockKey
    );
  });

  it.skip('should handle bytes and bytes[] parameters correctly', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'bytesMethod';
    const mockParams = ['0x1234', '["0xabcd", "0xef01"]'];
    const mockNetwork = 'testnet';
    const mockKey = 'testkey';
  
    interactWithContract.mockResolvedValue('Success');
  
    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      ...mockParams, 
      '-n', mockNetwork, 
      '-k', mockKey
    ]);
  
    expect(interactWithContract).toHaveBeenCalledWith(
      mockAddress, mockAbiPath, mockMethod, mockParams, mockNetwork, mockKey
    );
  });

  it.skip('should handle payable functions', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'payableMethod';
    const mockParams = ['1000000000000000000']; // 1 ETH in wei
    const mockNetwork = 'testnet';
    const mockKey = 'testkey';

    interactWithContract.mockResolvedValue('Success');

    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      ...mockParams, 
      '-n', mockNetwork, 
      '-k', mockKey
    ]);

    expect(interactWithContract).toHaveBeenCalledWith(
      mockAddress, mockAbiPath, mockMethod, mockParams, mockNetwork, mockKey
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Success'));
  });

  it.skip('should handle complex return types', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbiPath = './TestContract.json';
    const mockMethod = 'complexMethod';
    const mockNetwork = 'testnet';
    const mockKey = 'testkey';
  
    interactWithContract.mockResolvedValue({
      number: '42',
      string: 'Hello',
      array: [1, 2, 3],
      nested: { key: 'value' }
    });
  
    await program.parseAsync([
      'node', 'test', 'interact', 
      mockAddress, mockAbiPath, mockMethod, 
      '-n', mockNetwork, 
      '-k', mockKey
    ]);
  
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"number": "42"'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"string": "Hello"'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"array": [1,2,3]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"nested": {"key":"value"}'));
  });
});