// scripts/generate-password-hash.js
const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = '111111';
  const saltRounds = 12;
  
  console.log('🔐 Generating password hash for:', password);
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hash generated:');
    console.log(hash);
    
    console.log('\n📋 SQL UPDATE statement:');
    console.log(`UPDATE Users SET PasswordHash = '${hash}' WHERE UserID IN (1, 2, 3);`);
    
    // Verify the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n🔍 Verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
  } catch (error) {
    console.error('❌ Error generating hash:', error);
  }
}

generatePasswordHash();
