import React, { useState, useEffect } from 'react';
import { getApiUrl, API_CONFIG } from '../config/api';

const TestChatPage: React.FC = () => {
  const [status, setStatus] = useState<string>('Checking...');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    const currentUser = sessionStorage.getItem('currentUser');
    const accessToken = sessionStorage.getItem('accessToken');
    
    setUser(currentUser ? JSON.parse(currentUser) : null);
    setToken(accessToken);
    
    if (!currentUser || !accessToken) {
      setStatus('❌ Not logged in');
    } else {
      setStatus('✅ Logged in');
      loadConversations(accessToken);
    }
  };

  const login = async () => {
    try {
      setStatus('🔄 Logging in...');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'customer@muji.com',
          password: 'customer123',
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const result = await response.json();
      sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      sessionStorage.setItem('accessToken', result.tokens.accessToken);
      
      setUser(result.user);
      setToken(result.tokens.accessToken);
      setStatus('✅ Login successful');
      
      loadConversations(result.tokens.accessToken);
    } catch (error) {
      setStatus('❌ Login failed: ' + error);
    }
  };

  const loadConversations = async (accessToken: string) => {
    try {
      setStatus('🔄 Loading conversations...');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CHAT.ROOMS), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Chat API failed');
      }

      const data = await response.json();
      setConversations(data);
      setStatus('✅ Chat API working - ' + data.length + ' conversations');
    } catch (error) {
      setStatus('❌ Chat API failed: ' + error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Chat Page Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>User Info:</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Token:</h3>
        <p>{token ? '✅ Exists' : '❌ Missing'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Conversations:</h3>
        <pre>{JSON.stringify(conversations, null, 2)}</pre>
      </div>

      <div>
        <button 
          onClick={login}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Login Test
        </button>
        
        <button 
          onClick={checkStatus}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default TestChatPage;
