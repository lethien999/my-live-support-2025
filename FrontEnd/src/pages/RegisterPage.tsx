import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' // Chỉ cho phép customer
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    console.log('RegisterPage: Checking Google OAuth availability...');
    
    let attempts = 0;
    const maxAttempts = 50; // Tối đa 5 giây (50 * 100ms)
    
    // Check if Google API is loaded from HTML script
    const checkGoogleAPI = () => {
      attempts++;
      const win = window as any;
      
      if (win.google && win.google.accounts && win.google.accounts.id) {
        console.log('RegisterPage: ✅ Google API loaded successfully');
        setGoogleLoaded(true);
        setError(''); // Clear any previous errors
        return; // DỪNG LOOP
      }
      
      if (attempts >= maxAttempts) {
        console.log('RegisterPage: ❌ Google API not loaded after 5 seconds');
        setError('Google API không thể tải. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
        return; // DỪNG LOOP
      }
      
      setTimeout(checkGoogleAPI, 100);
    };
    
    // Wait a bit for HTML script to load
    setTimeout(checkGoogleAPI, 1000);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    try {
      const user = await AuthChatService.register(formData);
      setSuccess(`Đăng ký thành công! Chào mừng ${user.name}!`);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
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

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 0'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: 'black',
          marginBottom: '1.5rem'
        }}>
          Đăng ký tài khoản
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label htmlFor="name" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#3c4043', marginBottom: '0.5rem' }}>
              Họ và tên
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #e8eaed',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#3c4043', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #e8eaed',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>


          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#3c4043', marginBottom: '0.5rem' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #e8eaed',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#3c4043', marginBottom: '0.5rem' }}>
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #e8eaed',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#d1fae5',
              color: '#059669',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              border: '1px solid #a7f3d0'
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: isLoading ? '#9ca3af' : 'black',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '1rem'
            }}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{
          borderTop: '1px solid #e8eaed',
          paddingTop: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{ color: '#5f6368', marginBottom: '1rem' }}>
            Hoặc đăng nhập bằng
          </p>
          
          {googleLoaded ? (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: isLoading ? '#9ca3af' : '#4285f4',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </button>
          ) : (
            <div style={{
              width: '100%',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#666',
              fontSize: '1rem',
              fontWeight: '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⏳</span>
              Đang tải Google Sign-In...
            </div>
          )}
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e8eaed',
          textAlign: 'left'
        }}>
          <p style={{ color: '#5f6368', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Đã có tài khoản?
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: 'transparent',
              color: '#2563eb',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
