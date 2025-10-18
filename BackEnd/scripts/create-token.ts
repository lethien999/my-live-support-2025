import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-here-make-it-long-and-random';

async function createToken() {
  try {
    console.log('🔑 Creating new JWT token...');
    
    const payload = {
      userId: '3',
      email: 'customer@muji.com',
      role: 'Customer'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    
    console.log('✅ Token created:', token);
    
    // Test verification
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Token verified:', decoded);
    
  } catch (error) {
    console.error('❌ Error creating token:', error);
  }
}

createToken();
