import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    console.log('LoginPage: Checking Google OAuth availability...');
    
    let attempts = 0;
    const maxAttempts = 50; // Tối đa 5 giây (50 * 100ms)
    
    // Check if Google API is loaded from HTML script
    const checkGoogleAPI = () => {
      attempts++;
      const win = window as any;
      
      if (win.google && win.google.accounts && win.google.accounts.id) {
        console.log('LoginPage: ✅ Google API loaded successfully');
        setGoogleLoaded(true);
        setError(''); // Clear any previous errors
        return; // DỪNG LOOP
      }
      
      if (attempts >= maxAttempts) {
        console.log('LoginPage: ❌ Google API not loaded after 5 seconds');
        setError('Google API không thể tải. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
        return; // DỪNG LOOP
      }
      
      setTimeout(checkGoogleAPI, 100);
    };
    
    // Wait a bit for HTML script to load
    setTimeout(checkGoogleAPI, 1000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await AuthChatService.login(email, password);
      
      // Redirect to dashboard based on role
      setTimeout(() => {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 500);
    } catch (err) {
      setError('Email hoặc mật khẩu không đúng');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await AuthChatService.loginWithGoogle();
      console.log('Google login successful:', result);
      
      // Redirect to dashboard
      setTimeout(() => {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 500);
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Đăng nhập Google thất bại');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '4rem 3rem',
        border: '1px solid #f0f0f0',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '300',
            color: 'black',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            fontFamily: 'Arial, sans-serif'
          }}>
            Đăng nhập
          </h1>
          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            Vui lòng đăng nhập để tiếp tục
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '400',
              color: 'black',
              marginBottom: '0.8rem',
              letterSpacing: '0.05em',
              fontFamily: 'Arial, sans-serif'
            }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              style={{
                width: '100%',
                padding: '1rem 0',
                border: 'none',
                borderBottom: '1px solid #ccc',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s',
                backgroundColor: 'transparent',
                fontFamily: 'Arial, sans-serif',
                fontWeight: '300'
              }}
              onFocus={(e) => {
                e.target.style.borderBottomColor = 'black';
              }}
              onBlur={(e) => {
                e.target.style.borderBottomColor = '#ccc';
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '400',
              color: 'black',
              marginBottom: '0.8rem',
              letterSpacing: '0.05em',
              fontFamily: 'Arial, sans-serif'
            }}>
              MẬT KHẨU
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              style={{
                width: '100%',
                padding: '1rem 0',
                border: 'none',
                borderBottom: '1px solid #ccc',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s',
                backgroundColor: 'transparent',
                fontFamily: 'Arial, sans-serif',
                fontWeight: '300'
              }}
              onFocus={(e) => {
                e.target.style.borderBottomColor = 'black';
              }}
              onBlur={(e) => {
                e.target.style.borderBottomColor = '#ccc';
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8f8f8',
              color: '#666',
              padding: '1rem',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              border: '1px solid #e0e0e0',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '300'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: isLoading ? '#ccc' : 'black',
              color: 'white',
              padding: '1.2rem',
              borderRadius: '0',
              fontSize: '0.9rem',
              fontWeight: '400',
              border: '1px solid black',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              letterSpacing: '0.05em',
              fontFamily: 'Arial, sans-serif'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'black';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'black';
                e.currentTarget.style.color = 'white';
              }
            }}
          >
            {isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div style={{
          borderTop: '1px solid #f0f0f0',
          paddingTop: '2rem',
          marginTop: '2rem'
        }}>
          <p style={{ 
            color: '#666', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontWeight: '300',
            fontFamily: 'Arial, sans-serif'
          }}>
            Hoặc đăng nhập bằng
          </p>
          
                 {/* Google Sign-In Button */}
                 {googleLoaded ? (
                   <button
                     type="button"
                     onClick={handleGoogleLogin}
                     style={{
                       width: '100%',
                       backgroundColor: '#4285f4',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '1rem',
                       fontSize: '0.9rem',
                       fontWeight: '500',
                       cursor: 'pointer',
                       marginBottom: '1rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       gap: '0.5rem',
                       fontFamily: 'Arial, sans-serif',
                       transition: 'background-color 0.2s'
                     }}
                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3367d6'}
                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
                   >
                     <span style={{ fontSize: '1.2rem' }}>🔍</span>
                     Đăng nhập với Google
                   </button>
                 ) : (
                   <div style={{
                     backgroundColor: '#f5f5f5',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     padding: '1rem',
                     marginBottom: '1rem',
                     color: '#666',
                     fontSize: '0.8rem',
                     fontWeight: '400',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem',
                     letterSpacing: '0.05em',
                     fontFamily: 'Arial, sans-serif'
                   }}>
                     <span style={{ fontSize: '1.2rem' }}>⏳</span>
                     Đang tải Google Sign-In...
                   </div>
                 )}
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f8f8f8',
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#666', 
            fontSize: '0.9rem', 
            marginBottom: '1rem',
            fontWeight: '300',
            fontFamily: 'Arial, sans-serif'
          }}>
            Chưa có tài khoản?
          </p>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/register');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            style={{
              backgroundColor: 'transparent',
              color: 'black',
              border: '1px solid black',
              padding: '0.8rem 2rem',
              borderRadius: '0',
              fontSize: '0.9rem',
              fontWeight: '400',
              cursor: 'pointer',
              transition: 'all 0.3s',
              letterSpacing: '0.05em',
              fontFamily: 'Arial, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'black';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'black';
            }}
          >
            ĐĂNG KÝ NGAY
          </button>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #c3e6c3',
          fontSize: '0.8rem',
          color: '#059669'
        }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
            🔐 Hệ thống xác thực thật
          </p>
          <p>Chỉ sử dụng tài khoản đã đăng ký thật</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
