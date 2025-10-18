// test-env.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing environment file loading...');

// Read file directly
const envContent = fs.readFileSync('env.local', 'utf8');
console.log('📄 File content (first 200 chars):');
console.log(envContent.substring(0, 200));

// Parse manually
const lines = envContent.split('\n');
const envVars = {};

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join('=');
    }
  }
});

console.log('\n📊 Parsed environment variables:');
console.log('PORT:', envVars.PORT);
console.log('DATABASE_URL:', envVars.DATABASE_URL);
console.log('JWT_SECRET:', envVars.JWT_SECRET);
console.log('CORS_ORIGIN:', envVars.CORS_ORIGIN);

// Test dotenv
console.log('\n🔧 Testing dotenv...');
const dotenv = require('dotenv');
const result = dotenv.config({ path: 'env.local' });
console.log('Dotenv result:', result);

if (result.parsed) {
  console.log('✅ Dotenv parsed successfully');
  console.log('PORT from dotenv:', result.parsed.PORT);
} else {
  console.log('❌ Dotenv failed to parse');
}
