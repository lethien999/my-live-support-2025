import React, { useEffect } from 'react';

const GoogleCallbackPage: React.FC = () => {
  useEffect(() => {
    console.log('GoogleCallbackPage: Page loaded, URL:', window.location.href);
    
    // Lấy authorization code từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    console.log('GoogleCallbackPage: URL params - code:', code, 'error:', error);
    
    if (error) {
      console.log('GoogleCallbackPage: Error from Google:', error);
      // Gửi error message về parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Đăng nhập Google thất bại: ' + error
        }, '*');
      }
      // Đóng popup ngay lập tức
      window.close();
      return;
    }
    
    if (code) {
      console.log('GoogleCallbackPage: Got authorization code, exchanging...');
      // Gửi code về backend để exchange token
      fetch('http://localhost:4000/api/auth/google/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      .then(response => {
        console.log('GoogleCallbackPage: Exchange response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('GoogleCallbackPage: Exchange response data:', data);
        if (data.success) {
          // Gửi success message về parent window với code
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              code: code  // Gửi code thay vì user data
            }, '*');
          }
          // Đóng popup ngay lập tức
          window.close();
        } else {
          // Gửi error message về parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              error: data.code === 'EXPIRED_CODE' 
                ? 'Mã xác thực đã hết hạn. Vui lòng thử lại.' 
                : data.error || 'Đăng nhập thất bại'
            }, '*');
          }
          // Đóng popup ngay lập tức
          window.close();
        }
      })
      .catch(error => {
        console.error('GoogleCallbackPage: Exchange error:', error);
        // Gửi error message về parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Lỗi kết nối server: ' + error.message
          }, '*');
        }
        // Đóng popup ngay lập tức
        window.close();
      });
    } else {
      console.log('GoogleCallbackPage: No authorization code received');
      // Không có code, gửi error
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Không nhận được authorization code'
        }, '*');
      }
      // Đóng popup ngay lập tức
      window.close();
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div style={{ fontSize: '1.2rem', color: '#666' }}>
          Đang xử lý đăng nhập Google...
        </div>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
