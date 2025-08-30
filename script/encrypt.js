const fs = require('fs');
const path = require('path');
const CryptoJS = require('react-native-crypto-js');
const secreteKey =
  'be5be17a84f4ed5d4fb780ea3784d1f93a833e851585f831599720ed4b0b8a0e';

const envFilePath = path.resolve(__dirname, '../.env');
const envVariables = {};

if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVariables[key] = value;
    }
  });

  for (const key in envVariables) {
    const value = envVariables[key];
    if (!value.startsWith('encrypted:')) {
      let ciphertext = CryptoJS.AES.encrypt(
        envVariables[key],
        secreteKey,
      ).toString();
      envVariables[key] = `encrypted:${ciphertext}`;
    }
  }

  const newEnvContent = Object.entries(envVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(envFilePath, newEnvContent, 'utf8');
}
