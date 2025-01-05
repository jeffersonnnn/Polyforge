// src/utils/input-validation.js

const fs = require('fs');
const ethers = require('ethers');
const { ValidationError } = require('./errors');

function validateContractPath(path) {
  if (!path || typeof path !== 'string') {
    throw new ValidationError('Contract path must be a non-empty string.');
  }
  if (!fs.existsSync(path)) {
    throw new ValidationError(`Contract file not found: ${path}`);
  }
  if (!path.endsWith('.json')) {
    throw new ValidationError('Contract file must be a JSON file.');
  }
}

const { getAvailableNetworks } = require('./config');

function validateNetwork(network, availableNetworks) {
  if (!availableNetworks.includes(network)) {
    throw new ValidationError(`Invalid network. Available networks are: ${availableNetworks.join(', ')}`);
  }
}

function validateKeyName(keyName) {
  if (!keyName || typeof keyName !== 'string') {
    throw new ValidationError('Key name must be a non-empty string.');
  }
}

function validateContractAddress(address) {
  if (!ethers.isAddress(address)) {
    throw new ValidationError('Invalid contract address.');
  }
}

function validateMethodName(methodName) {
  if (!methodName || typeof methodName !== 'string') {
    throw new ValidationError('Method name must be a non-empty string.');
  }
}

function validateParams(params, abi, methodName) {
  const method = abi.find(item => item.name === methodName && item.type === 'function');
  if (!method) {
    throw new ValidationError(`Method '${methodName}' not found in ABI.`);
  }
  if (params.length !== method.inputs.length) {
    throw new ValidationError(`Invalid number of parameters. Expected ${method.inputs.length}, got ${params.length}.`);
  }

  method.inputs.forEach((input, index) => {
    validateParam(params[index], input.type, index);
  });
}

function validateParam(param, paramType, index) {
  try {
    switch (true) {
      case paramType.startsWith('uint') || paramType.startsWith('int'):
        validateInteger(param, paramType, index);
        break;
      case paramType === 'bool':
        validateBoolean(param, index);
        break;
      case paramType === 'address':
        validateAddress(param, index);
        break;
      case paramType === 'string':
        validateString(param, index);
        break;
      case paramType.startsWith('bytes'):
        validateBytes(param, paramType, index);
        break;
      case paramType.endsWith('[]'):
        validateArray(param, paramType.slice(0, -2), index);
        break;
      case isTupleType(paramType):
        validateTuple(param, paramType, index);
        break;
      default:
        console.warn(`Warning: No specific validation for ${paramType}`);
    }
  } catch (error) {
    throw new ValidationError(`Invalid parameter ${index + 1}: ${error.message}`);
  }
}

function validateInteger(param, paramType, index) {
  try {
    const value = BigInt(param);
    const bits = parseInt(paramType.replace(/^(u)?int/, '')) || 256;
    const isSigned = !paramType.startsWith('u');
    const min = isSigned ? -(2n ** BigInt(bits - 1)) : 0n;
    const max = isSigned ? (2n ** BigInt(bits - 1)) - 1n : (2n ** BigInt(bits)) - 1n;

    if (value < min || value > max) {
      throw new Error(`must be within the range of ${paramType}`);
    }
  } catch (error) {
    throw new Error(`must be a valid ${paramType}`);
  }
}

function validateBoolean(param, index) {
  if (typeof param !== 'boolean' && !['true', 'false'].includes(param.toLowerCase())) {
    throw new Error('must be a boolean');
  }
}

function validateAddress(param, index) {
  if (!ethers.isAddress(param)) {
    throw new Error('must be a valid Ethereum address');
  }
}

function validateString(param, index) {
  if (typeof param !== 'string') {
    throw new Error('must be a string');
  }
}

function validateBytes(param, paramType, index) {
  if (!ethers.isHexString(param)) {
    throw new Error('must be a valid hex string');
  }
  if (paramType !== 'bytes') {
    const size = parseInt(paramType.replace('bytes', ''));
    if (ethers.hexDataLength(param) !== size) {
      throw new Error(`must be exactly ${size} bytes long`);
    }
  }
}

function validateArray(param, elementType, index) {
  let array;
  try {
    array = JSON.parse(param);
  } catch (error) {
    throw new Error('must be a valid JSON array');
  }
  
  if (!Array.isArray(array)) {
    throw new Error('must be an array');
  }
  
  array.forEach((element, elementIndex) => {
    validateParam(element, elementType, `${index}[${elementIndex}]`);
  });
}

function validateTuple(param, paramType, index) {
  let tuple;
  try {
    tuple = JSON.parse(param);
  } catch (error) {
    throw new Error('must be a valid JSON object');
  }

  if (typeof tuple !== 'object' || tuple === null || Array.isArray(tuple)) {
    throw new Error('must be an object (tuple)');
  }

  const tupleTypes = parseTupleType(paramType);

  tupleTypes.forEach((field, fieldIndex) => {
    const fieldName = field.name || fieldIndex.toString();
    const fieldValue = tuple[fieldName];

    if (fieldValue === undefined) {
      throw new Error(`Missing field '${fieldName}' in tuple`);
    }

    try {
      validateParam(fieldValue, field.type, `${index}.${fieldName}`);
    } catch (error) {
      throw new Error(`Field '${fieldName}': ${error.message}`);
    }
  });
}

function parseTupleType(paramType) {
  const tupleContent = paramType.match(/tuple\((.*)\)(\[\])?$/);
  if (!tupleContent) {
    throw new Error(`Invalid tuple type: ${paramType}`);
  }

  const fieldTypes = tupleContent[1].split(',').map(field => field.trim());

  return fieldTypes.map(fieldType => {
    const [type, name] = fieldType.split(' ');
    return { type, name: name || null };
  });
}

function isTupleType(type) {
  return type.startsWith('tuple');
}

module.exports = {
  validateContractPath,
  validateNetwork,
  validateKeyName,
  validateContractAddress,
  validateMethodName,
  validateParams,
};