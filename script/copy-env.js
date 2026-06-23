/**
 * Copies .env.prod → .env so react-native-config (iOS) and Android debug builds
 * pick up the same values. iOS reads ENVFILE=.env by default, not .env.prod.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, '.env.prod');
const target = path.join(root, '.env');

if (!fs.existsSync(source)) {
  console.error('copy-env: .env.prod not found at', source);
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log('copy-env: .env.prod → .env');
