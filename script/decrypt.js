const fs = require('fs');
const path = require('path');
const CryptoJS = require('react-native-crypto-js');
const secreteKey =
  'be5be17a84f4ed5d4fb780ea3784d1f93a833e851585f831599720ed4b0b8a0e';

const envFilePath = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../.env');
const envVariables = {};

console.log(`[Decrypt] Using env file: ${envFilePath}`);

if (fs.existsSync(envFilePath)) {
  console.log('[Decrypt] Reading .env file...');
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVariables[key] = value;
    }
  });

  let decryptedCount = 0;
  for (const key in envVariables) {
    const value = envVariables[key];
    if (value.startsWith('encrypted:')) {
      const ciphertext = value.replace('encrypted:', '');
      let bytes = CryptoJS.AES.decrypt(ciphertext, secreteKey);
      let originalText = bytes.toString(CryptoJS.enc.Utf8);
      envVariables[key] = originalText;
      console.log(`[Decrypt] Decrypted key: ${key}`);
      decryptedCount++;
    }
  }

  if (decryptedCount === 0) {
    console.log('[Decrypt] No encrypted variables found.');
  } else {
    console.log(`[Decrypt] Decrypted ${decryptedCount} variable(s).`);
  }

  const newEnvContent = Object.entries(envVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(envFilePath, newEnvContent, 'utf8');
  console.log('[Decrypt] .env file updated.');
} else {
  console.error(`[Decrypt] File not found: ${envFilePath}`);
}
