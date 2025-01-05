class PolyForgeError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class NetworkError extends PolyForgeError {
    constructor(message) {
      super(`Network Error: ${message}`);
    }
  }
  
  class ContractError extends PolyForgeError {
    constructor(message) {
      super(`Contract Error: ${message}`);
    }
  }
  
  class ValidationError extends PolyForgeError {
    constructor(message) {
      super(`Validation Error: ${message}`);
    }
  }
  
  class KeyManagementError extends PolyForgeError {
    constructor(message) {
      super(`Key Management Error: ${message}`);
    }
  }
  
  module.exports = {
    PolyForgeError,
    NetworkError,
    ContractError,
    ValidationError,
    KeyManagementError,
  };