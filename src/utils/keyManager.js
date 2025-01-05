const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { KeyManagementError } = require('./errors');

const KEYS_FILE = path.join(process.env.HOME, '.polyforge', 'keys.json');

function encrypt(text, password) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text, password) {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(password, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function getPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function storeKey(name, privateKey) {
  const password = await getPassword();
  const encryptedKey = encrypt(privateKey, password);
  
  let keys = {};
  if (fs.existsSync(KEYS_FILE)) {
    keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  }
  
  keys[name] = encryptedKey;
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
  console.log(`Key '${name}' stored successfully.`);
}

async function getKey(name) {
  if (!fs.existsSync(KEYS_FILE)) {
    throw new KeyManagementError('No keys found. Use "polyforge key add <name>" to add a key.');
  }
  
  const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  if (!keys[name]) {
    throw new KeyManagementError(`Key '${name}' not found.`);
  }
  
  const password = await getPassword();
  try {
    return decrypt(keys[name], password);
  } catch (error) {
    throw new KeyManagementError('Incorrect password or corrupted key.');
  }
}

function listKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    console.log('No keys found.');
    return;
  }
  
  const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  console.log('Available keys:');
  Object.keys(keys).forEach(key => console.log(`- ${key}`));
}

function removeKey(name) {
  if (!fs.existsSync(KEYS_FILE)) {
    throw new KeyManagementError('No keys found.');
  }
  
  let keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  if (!keys[name]) {
    throw new KeyManagementError(`Key '${name}' not found.`);
  }
  
  delete keys[name];
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
  console.log(`Key '${name}' removed successfully.`);
}

module.exports = {
  storeKey,
  getKey,
  listKeys,
  removeKey
};