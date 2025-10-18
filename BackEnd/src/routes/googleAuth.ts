import { google } from 'googleapis';
import express from 'express';
import { config } from '@/config/env';

const router = express.Router();

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret,
  config.googleRedirectUri
);

// Set default scopes for UserInfo API
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
  'profile',
  'email'
];

// Google OAuth callback endpoint
router.post('/auth/google', async (req, res) => {
  try {
    console.log('🔍 Google OAuth endpoint hit');
    console.log('📝 Request body:', req.body);
    console.log('🔑 Environment variables:');
    console.log('  - GOOGLE_CLIENT_ID:', config.googleClientId ? 'SET' : 'NOT SET');
    console.log('  - GOOGLE_CLIENT_SECRET:', config.googleClientSecret ? 'SET' : 'NOT SET');
    console.log('  - GOOGLE_REDIRECT_URI:', config.googleRedirectUri);
    
    const { code, redirectUri } = req.body;

    if (!code) {
      console.log('❌ No authorization code provided');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange authorization code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Tokens received:', Object.keys(tokens));
    oauth2Client.setCredentials(tokens);

    // Get user info from Google UserInfo API (simpler than People API)
    console.log('🔄 Getting user info from Google...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Extract user data from UserInfo API response
    const email = data.email;
    const name = data.name;
    const photo = data.picture;
    const googleId = data.id;

    if (!email || !name) {
      return res.status(400).json({ error: 'Unable to get user information from Google' });
    }

    // Check if user exists in database
    // For now, we'll create a simple user object
    const user = {
      id: `google_${googleId}`,
      email: email,
      name: name,
      role: 'customer', // Default role for Google users
      googleId: googleId,
      avatar: photo
    };

    // In a real app, you would save this to your database
    console.log('Google user logged in:', user);

    res.json({
      success: true,
      user: user,
      message: 'Google login successful'
    });

  } catch (error: any) {
    console.error('Google OAuth error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      response: error?.response?.data
    });
    
    res.status(500).json({ 
      error: 'Google authentication failed',
      details: error?.message || 'Unknown error',
      code: error?.code || 'unknown'
    });
  }
});

// Get Google OAuth URL
router.get('/auth/google/url', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    redirect_uri: config.googleRedirectUri
  });

  res.json({ authUrl });
});

export default router;
