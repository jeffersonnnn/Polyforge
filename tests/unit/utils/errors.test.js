const {
    PolyForgeError,
    NetworkError,
    ContractError,
    ValidationError,
    KeyManagementError
  } = require('../../../src/utils/errors');
  
  describe('Custom Errors', () => {
    describe('PolyForgeError', () => {
      it('should create a PolyForgeError with correct properties', () => {
        const error = new PolyForgeError('Test error');
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('PolyForgeError');
        expect(error.message).toBe('Test error');
      });
  
      it('should capture stack trace', () => {
        const error = new PolyForgeError('Test error');
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('PolyForgeError: Test error');
      });
    });
  
    describe('NetworkError', () => {
      it('should create a NetworkError with correct properties', () => {
        const error = new NetworkError('Network connection failed');
        expect(error).toBeInstanceOf(PolyForgeError);
        expect(error.name).toBe('NetworkError');
        expect(error.message).toBe('Network Error: Network connection failed');
      });
    });
  
    describe('ContractError', () => {
      it('should create a ContractError with correct properties', () => {
        const error = new ContractError('Invalid contract address');
        expect(error).toBeInstanceOf(PolyForgeError);
        expect(error.name).toBe('ContractError');
        expect(error.message).toBe('Contract Error: Invalid contract address');
      });
    });
  
    describe('ValidationError', () => {
      it('should create a ValidationError with correct properties', () => {
        const error = new ValidationError('Invalid input');
        expect(error).toBeInstanceOf(PolyForgeError);
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Validation Error: Invalid input');
      });
    });
  
    describe('KeyManagementError', () => {
      it('should create a KeyManagementError with correct properties', () => {
        const error = new KeyManagementError('Key not found');
        expect(error).toBeInstanceOf(PolyForgeError);
        expect(error.name).toBe('KeyManagementError');
        expect(error.message).toBe('Key Management Error: Key not found');
      });
    });
  
    describe('Error inheritance', () => {
      it('should allow catching specific error types', () => {
        try {
          throw new NetworkError('Test network error');
        } catch (error) {
          if (error instanceof NetworkError) {
            expect(error.message).toBe('Network Error: Test network error');
          } else {
            fail('Should have caught NetworkError');
          }
        }
      });
  
      it('should allow catching PolyForgeError for all custom errors', () => {
        const errors = [
          new NetworkError('Network error'),
          new ContractError('Contract error'),
          new ValidationError('Validation error'),
          new KeyManagementError('Key management error')
        ];
  
        errors.forEach(error => {
          expect(error).toBeInstanceOf(PolyForgeError);
        });
      });
    });
  });