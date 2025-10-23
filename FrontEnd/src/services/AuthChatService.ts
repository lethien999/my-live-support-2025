// Authentication and Chat Service
import { getApiUrl, API_CONFIG } from '../config/api';

class AuthChatService {
  private static currentUser: any = null;
  private static socket: any = null;
  private static exchangeInProgress: boolean = false;
  private static _______messageHandlers: ((_message: any) => void)[] = [];
  
  // Explicitly use the variable to avoid TS6133
  static { void this._______messageHandlers; }

  // Auto-login for customer (for testing purposes)
  static async autoLoginCustomer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'customer@muji.com',
          password: '123456'
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      if (data.success && data.tokens) {
        // Store tokens
        sessionStorage.setItem('accessToken', data.tokens.accessToken);
        sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        
        console.log('✅ Customer auto-login successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Customer auto-login failed:', error);
      return false;
    }
  }

  // Auto-login for agent (for testing purposes)
  static async autoLoginAgent(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:4000/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@muji.com',
          password: 'admin123'
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      if (data.success && data.tokens) {
        // Store tokens
        sessionStorage.setItem('accessToken', data.tokens.accessToken);
        sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        
        console.log('✅ Agent auto-login successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Agent auto-login failed:', error);
      return false;
    }
  }

  // Get user email from token
  static getUserEmailFromToken(token: any): string | null {
    try {
      if (!token) return null;
      
      // Ensure token is a string
      const tokenStr = typeof token === 'string' ? token : String(token);
      
      // Handle Google token format
      if (tokenStr.startsWith('google_token_')) {
        // Extract email from token if available
        // For now, return a default email or extract from localStorage
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        return userEmail;
      }
      
      // Fallback 1: try to read from currentUser in storage
      try {
        const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.email) return u.email;
          if (u?.Email) return u.Email;
          if (u?.user?.email) return u.user.email;
        }
      } catch {}

      // Fallback 2: if token looks like JWT, decode payload to read email
      if (tokenStr.split('.').length === 3) {
        try {
          const payload = JSON.parse(atob(tokenStr.split('.')[1]));
          if (payload?.email) return payload.email;
          if (payload?.sub && typeof payload.sub === 'string' && payload.sub.includes('@')) return payload.sub;
        } catch {}
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting user email from token:', error);
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      // Handle old token format
      if (token.startsWith('real_token_') || token.startsWith('real_refresh_')) {
        console.log('🔍 AuthChatService - Old token format detected, treating as expired');
        return true;
      }
      
      // Handle Google token format (google_token_timestamp)
      if (token.startsWith('google_token_')) {
        const parts = token.split('_');
        if (parts.length !== 3) return true;
        
        const timestamp = parseInt(parts[2]);
        const now = Date.now();
        const expiration = 3600000; // 1 hour for Google tokens
        
        return (now - timestamp) > expiration;
      }
      
      // Handle regular token format (access_timestamp_random_expiration)
      const parts = token.split('_');
      if (parts.length !== 4) return true;
      
      const timestamp = parseInt(parts[1]);
      const expiration = parseInt(parts[3]);
      const now = Date.now();
      
      return (now - timestamp) > expiration;
    } catch {
      return true;
    }
  }

  // Refresh token if needed
  static async refreshTokenIfNeeded(): Promise<string | null> {
    // Try sessionStorage first, then localStorage
    let token = sessionStorage.getItem('accessToken');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    
    console.log('🔍 AuthChatService.refreshTokenIfNeeded() - Found token:', token);
    console.log('🔍 AuthChatService.refreshTokenIfNeeded() - Token type:', typeof token);
    
    if (!token) {
      console.log('🔍 AuthChatService.refreshTokenIfNeeded() - No token found');
      return null;
    }

    if (this.isTokenExpired(token)) {
      console.log('🔄 Token expired, attempting refresh...');
      try {
        // Try sessionStorage first, then localStorage
        let refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          refreshToken = localStorage.getItem('refreshToken');
        }
        
        if (!refreshToken) {
          console.log('❌ No refresh token available');
          this.logout();
          return null;
        }

        // Check if refresh token is old format
        if (refreshToken.startsWith('real_refresh_') || refreshToken.startsWith('refresh_token_')) {
          console.log('❌ Old refresh token format detected, cannot refresh');
          this.logout();
          return null;
        }

        const response = await fetch(getApiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          const newToken = data.tokens.accessToken;
          
          // Store in both sessionStorage and localStorage
          sessionStorage.setItem('accessToken', newToken);
          localStorage.setItem('accessToken', newToken);
          
          console.log('✅ Token refreshed successfully');
          return newToken;
        } else {
          console.log('❌ Token refresh failed - response not ok');
          this.logout();
          return null;
        }
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        this.logout();
        return null;
      }
    }

    return token;
  }

  // Initialize authentication
  static init() {
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('Unregistering service worker:', registration.scope);
          registration.unregister();
        });
      });
    }
    
    // Clear old format tokens
    this.clearOldTokens();
    
    // Check if user is logged in from sessionStorage (tab-specific)
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      console.log('AuthChatService: Loaded user from sessionStorage:', this.currentUser);
    }
  }

  // Clear old format tokens
  static clearOldTokens() {
    const accessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
    
    if (accessToken && (accessToken.startsWith('real_token_') || accessToken.startsWith('access_token_'))) {
      console.log('🧹 Clearing old access token format');
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('accessToken');
    }
    
    if (refreshToken && (refreshToken.startsWith('real_refresh_') || refreshToken.startsWith('refresh_token_'))) {
      console.log('🧹 Clearing old refresh token format');
      sessionStorage.removeItem('refreshToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Register function - Real API call
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'customer';
  }) {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Đăng ký thất bại');
      }

      const result = await response.json();
      console.log('AuthChatService: Registration successful:', result);
      
      // Auto-login after registration
      return await this.login(userData.email, userData.password);
    } catch (error: any) {
      console.error('AuthChatService: Registration error:', error);
      throw error;
    }
  }

  // Login function - Real API call
  static async login(email: string, password: string) {
    try {
      const loginUrl = getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN);
      console.log('🔍 AuthChatService: Login URL:', loginUrl);
      console.log('🔍 AuthChatService: Login data:', { email, password });
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log('🔍 AuthChatService: Response status:', response.status);
      console.log('🔍 AuthChatService: Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 AuthChatService: Error data:', errorData);
        throw new Error(errorData.error || 'Email hoặc mật khẩu không đúng');
      }

      const result = await response.json();
      console.log('AuthChatService: Login successful:', result);
      console.log('AuthChatService: Response success:', result.success);
      console.log('AuthChatService: Response tokens:', result.tokens);
      
      this.currentUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      };
      
      console.log('AuthChatService: Storing tokens:', {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      });
      
      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      sessionStorage.setItem('accessToken', result.tokens.accessToken);
      sessionStorage.setItem('refreshToken', result.tokens.refreshToken);
      
      // Verify storage
      console.log('AuthChatService: Verification - stored token:', sessionStorage.getItem('accessToken'));
      
      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent('authChange'));
      
      console.log('AuthChatService: User logged in and saved to sessionStorage:', this.currentUser);
      return this.currentUser;
    } catch (error: any) {
      console.error('AuthChatService: Login error:', error);
      throw error;
    }
  }

  // Google Login function - Real OAuth (LEGACY - REMOVED TO FIX DUPLICATE)

  // Load Google OAuth script - CHỈ KIỂM TRA HTML SCRIPT
  static loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      console.log('AuthChatService: Checking Google API from HTML script only...');
      
      // Chỉ kiểm tra Google API từ HTML script, KHÔNG load dynamic
      const win = window as any;
      if (win.google && win.google.accounts && win.google.accounts.id) {
        console.log('AuthChatService: ✅ Google API loaded from HTML script');
        resolve(true);
        return;
      }

      // Nếu không có, đợi một chút rồi reject
      setTimeout(() => {
        console.error('AuthChatService: ❌ Google API not available from HTML script');
        reject(new Error('Google API không được tải từ HTML script. Vui lòng kiểm tra script tag trong index.html'));
      }, 2000);
    });
  }

  // Exchange Google authorization code for tokens
  static async exchangeGoogleCode(code: string): Promise<{ user: any; tokens: any }> {
    // Debounce: chỉ cho phép 1 request tại một thời điểm
    if (this.exchangeInProgress) {
      throw new Error('Google OAuth exchange đang được xử lý, vui lòng đợi...');
    }
    
    this.exchangeInProgress = true;
    
    try {
      const response = await fetch('http://localhost:4000/api/auth/google/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error codes
        if (errorData.code === 'EXPIRED_CODE') {
          throw new Error('Mã xác thực đã hết hạn. Vui lòng thử lại.');
        }
        
        if (errorData.code === 'DUPLICATE_CODE') {
          throw new Error('Mã xác thực đã được sử dụng. Vui lòng thử lại.');
        }
        
        throw new Error(errorData.error || 'Google OAuth exchange failed');
      }

      const result = await response.json();
      return result;
    } finally {
      this.exchangeInProgress = false;
    }
  }

  // Google OAuth login - POPUP METHOD (Phổ biến nhất)
  static async loginWithGoogle(): Promise<{ user: any; tokens: any }> {
    return new Promise((resolve, reject) => {
      const clientId = '368647547349-ispre03gps1ur9197q6eeut9c5uhdvci.apps.googleusercontent.com';
      const redirectUri = 'http://localhost:5173/auth/google/callback';
      
      // Tạo Google OAuth URL
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      console.log('AuthChatService: Opening Google OAuth popup...');
      
      // Mở popup window
      const popup = window.open(
        googleAuthUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        reject(new Error('Popup bị chặn. Vui lòng cho phép popup.'));
        return;
      }
      
      // Lắng nghe message từ popup
      const messageListener = (event: MessageEvent) => {
        console.log('AuthChatService: Received message:', event.data, 'from origin:', event.origin);
        
        // Accept messages from same origin or Google's domain
        if (event.origin !== window.location.origin && !event.origin.includes('google.com')) {
          console.log('AuthChatService: Ignoring message from untrusted origin:', event.origin);
          return;
        }
        
        if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          // Không cố gắng đóng popup từ cửa sổ chính - để popup tự đóng
          
          // Call backend API to exchange code for tokens
          this.exchangeGoogleCode(event.data.code)
            .then((result) => {
              // Store user data from backend response
              this.currentUser = result.user;
              sessionStorage.setItem('currentUser', JSON.stringify(result.user));
              sessionStorage.setItem('accessToken', result.tokens.accessToken);
              sessionStorage.setItem('refreshToken', result.tokens.refreshToken);
              
              console.log('AuthChatService: ✅ Google login successful');
              
              // Trigger auth change events
              window.dispatchEvent(new CustomEvent('authChange'));
              window.dispatchEvent(new CustomEvent('googleAuthSuccess'));
              
              // Auto redirect to dashboard
              setTimeout(() => {
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }, 1000);
              
              resolve(result);
            })
            .catch((error) => {
              console.error('AuthChatService: ❌ Google login failed:', error);
              
              // Show user-friendly error message
              if (error.message.includes('hết hạn')) {
                alert('Mã xác thực Google đã hết hạn. Vui lòng thử lại.');
              } else {
                alert('Đăng nhập Google thất bại: ' + error.message);
              }
              
              reject(error);
            });
        } else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          // Không cố gắng đóng popup từ cửa sổ chính
          reject(new Error(event.data.error));
        }
      };
      
      window.addEventListener('message', messageListener);
      
        // Kiểm tra popup đã đóng chưa và timeout
        let timeoutCount = 0;
        const maxTimeout = 60; // 1 phút
        
        const checkClosed = setInterval(() => {
          timeoutCount++;
          
          // Không kiểm tra popup.closed để tránh COOP error
          if (timeoutCount >= maxTimeout) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            // Không cố gắng đóng popup từ cửa sổ chính
            reject(new Error('Đăng nhập quá lâu, vui lòng thử lại'));
          }
        }, 1000);
    });
  }

  // Create Admin/Agent account - chỉ Admin mới có thể dùng
  static async createStaffAccount(userData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'agent';
  }) {
    const currentUser = this.getCurrentUser();
    
    // Chỉ Admin mới có thể tạo tài khoản staff
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Chỉ Admin mới có thể tạo tài khoản nhân viên');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if email already exists
    const existingUsers = this.getStoredUsers();
    if (existingUsers.find((u: { email?: string }) => u.email === userData.email)) {
      throw new Error('Email đã được sử dụng');
    }

    // Create new staff user
    const newUser = {
      id: `staff_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      password: userData.password,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    // Store user
    existingUsers.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(existingUsers));

    console.log(`Admin ${currentUser.name} đã tạo tài khoản ${userData.role}: ${userData.name}`);
    
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };
  }

  // Get stored users from localStorage
  private static getStoredUsers() {
    try {
      const stored = localStorage.getItem('registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading stored users:', error);
      return [];
    }
  }

  // Logout function
  static logout() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Dispatch auth change event
    window.dispatchEvent(new CustomEvent('authChange'));
    
    console.log('AuthChatService: User logged out and removed from sessionStorage');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get current user
  static getCurrentUser() {
    // Try to load from sessionStorage first
    if (!this.currentUser) {
      try {
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
          console.log('🔍 AuthChatService.getCurrentUser() - Loaded from sessionStorage:', this.currentUser);
          
          // If user exists but no valid token, try to get new token
          const token = this.getToken();
          if (!token) {
            console.log('🔍 AuthChatService.getCurrentUser() - User found but no token, attempting to get new token...');
            // This will trigger token refresh or login
          }
        }
      } catch (error) {
        console.error('❌ AuthChatService.getCurrentUser() - Error loading from sessionStorage:', error);
      }
    }
    
    return this.currentUser;
  }

  // Get access token (with auto-refresh)
  static async getToken() {
    // Try sessionStorage first, then localStorage
    // Check both 'accessToken' and 'token' keys for compatibility
    let token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    }
    
    console.log('🔍 AuthChatService.getToken() - Found token:', token);
    console.log('🔍 AuthChatService.getToken() - Token type:', typeof token);
    console.log('🔍 AuthChatService.getToken() - SessionStorage keys:', Object.keys(sessionStorage));
    console.log('🔍 AuthChatService.getToken() - LocalStorage keys:', Object.keys(localStorage));
    
    if (!token) {
      console.log('🔍 AuthChatService.getToken() - No token found');
      return null;
    }
    
    // Check if token is expired and try to refresh
    if (this.isTokenExpired(token)) {
      console.log('🔍 AuthChatService.getToken() - Token expired, attempting refresh...');
      const refreshedToken = await this.refreshTokenIfNeeded();
      if (refreshedToken) {
        console.log('🔍 AuthChatService.getToken() - Token refreshed successfully');
        return refreshedToken;
      } else {
        console.log('🔍 AuthChatService.getToken() - Token refresh failed');
        return null;
      }
    }
    
    console.log('🔍 AuthChatService.getToken() - Token valid, returning:', token);
    return token;
  }

  // Check if user is authenticated
  static isAuthenticated() {
    return this.currentUser !== null;
  }

  // Check user role
  static hasRole(role: string) {
    return this.currentUser && this.currentUser.role === role;
  }

  // Check if user can access route
  static canAccessRoute(route: string) {
    if (!this.currentUser) return false;
    
    switch (route) {
      case '/dashboard':
        return true; // All authenticated users can access dashboard
      case '/chat':
        return true; // All authenticated users can access chat
      case '/admin':
        return this.currentUser.role === 'Admin';
      case '/agent':
        return this.currentUser.role === 'Agent' || this.currentUser.role === 'Admin';
      default:
        return true;
    }
  }

  // Initialize Socket.IO connection - DISABLED (using SocketService instead)
  static connectSocket() {
    console.log('⚠️ AuthChatService.connectSocket() is disabled - use SocketService instead');
    return null;
  }

  // Send message - DISABLED (use SocketService instead)
  static sendMessage(_content: string) {
    console.log('⚠️ AuthChatService.sendMessage() is disabled - use SocketService instead');
  }

  // Get role-based permissions
  static getPermissions() {
    if (!this.currentUser) return {};
    
    const role = this.currentUser.role;
    
    switch (role) {
      case 'admin':
        return {
          canViewAllTickets: true,
          canAssignTickets: true,
          canDeleteTickets: true,
          canViewAnalytics: true,
          canManageUsers: true,
          canAccessAdminPanel: true,
          canChatWithAnyone: true,
          canViewAllChats: true
        };
      case 'agent':
        return {
          canViewAllTickets: true,
          canAssignTickets: true,
          canDeleteTickets: false,
          canViewAnalytics: true,
          canManageUsers: false,
          canAccessAdminPanel: false,
          canChatWithAnyone: true,
          canViewAllChats: true
        };
      case 'customer':
        return {
          canViewAllTickets: false,
          canAssignTickets: false,
          canDeleteTickets: false,
          canViewAnalytics: false,
          canManageUsers: false,
          canAccessAdminPanel: false,
          canChatWithAnyone: false,
          canViewAllChats: false
        };
      default:
        return {};
    }
  }

  // Get role display info
  static getRoleInfo() {
    if (!this.currentUser) return null;
    
    const role = this.currentUser.role;
    
    switch (role) {
      case 'Admin':
        return {
          title: 'Admin Dashboard',
          icon: '👑',
          color: '#dc2626',
          description: 'Quản lý toàn bộ hệ thống',
          permissions: ['Xem tất cả tickets', 'Phân công tickets', 'Xóa tickets', 'Xem analytics', 'Quản lý users', 'Truy cập admin panel']
        };
      case 'Agent':
        return {
          title: 'Agent Dashboard',
          icon: '👨‍💼',
          color: '#2563eb',
          description: 'Hỗ trợ khách hàng',
          permissions: ['Xem tất cả tickets', 'Phân công tickets', 'Xem analytics', 'Chat với khách hàng']
        };
      case 'Customer':
        return {
          title: 'Customer Dashboard',
          icon: '👤',
          color: '#059669',
          description: 'Quản lý tài khoản cá nhân',
          permissions: ['Xem tickets của mình', 'Tạo tickets mới', 'Chat với agent']
        };
      default:
        return null;
    }
  }
}

// Initialize service
AuthChatService.init();

export default AuthChatService;
