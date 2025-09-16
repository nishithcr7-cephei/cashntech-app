const fs = require('fs');
const path = require('path');
const CryptoJS = require('react-native-crypto-js');
const secreteKey =
  'be5be17a84f4ed5d4fb780ea3784d1f93a833e851585f831599720ed4b0b8a0e';

const envFilePath = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../.env');
const envVariables = {};

console.log(`[Encrypt] Using env file: ${envFilePath}`);

if (fs.existsSync(envFilePath)) {
  console.log('[Encrypt] Reading .env file...');
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVariables[key] = value;
    }
  });

  let encryptedCount = 0;
  for (const key in envVariables) {
    const value = envVariables[key];
    if (!value.startsWith('encrypted:')) {
      let ciphertext = CryptoJS.AES.encrypt(
        envVariables[key],
        secreteKey,
      ).toString();
      envVariables[key] = `encrypted:${ciphertext}`;
      console.log(`[Encrypt] Encrypted key: ${key}`);
      encryptedCount++;
    }
  }

  if (encryptedCount === 0) {
    console.log('[Encrypt] No unencrypted variables found.');
  } else {
    console.log(`[Encrypt] Encrypted ${encryptedCount} variable(s).`);
  }

  const newEnvContent = Object.entries(envVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(envFilePath, newEnvContent, 'utf8');
  console.log('[Encrypt] .env file updated.');
} else {
  console.error(`[Encrypt] File not found: ${envFilePath}`);
}
