// Authentication and Chat Service
import { getApiUrl, API_CONFIG } from '../config/api';

class AuthChatService {
  private static currentUser: any = null;
  private static socket: any = null;
  private static exchangeInProgress: boolean = false;
  private static messageHandlers: ((message: any) => void)[] = [];

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Refresh token if needed
  static async refreshTokenIfNeeded(): Promise<string | null> {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      console.log('Token expired, attempting refresh...');
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log('No refresh token available');
          this.logout();
          return null;
        }

        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          console.log('Token refreshed successfully');
          return data.accessToken;
        } else {
          console.log('Token refresh failed');
          this.logout();
          return null;
        }
      } catch (error) {
        console.error('Token refresh error:', error);
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
    
    // Check if user is logged in from sessionStorage (tab-specific)
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      console.log('AuthChatService: Loaded user from sessionStorage:', this.currentUser);
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
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
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

  // Google Login function - Real OAuth
  static async loginWithGoogle() {
    try {
      console.log('AuthChatService: loginWithGoogle called.');
      
      // Check if Google OAuth2 is loaded
      if (typeof (window as any).google === 'undefined' || 
          !(window as any).google.accounts || 
          !(window as any).google.accounts.oauth2) {
        console.error('AuthChatService: Google OAuth2 not loaded when loginWithGoogle was called.');
        throw new Error('Google OAuth2 chưa được tải. Vui lòng thử lại.');
      }

      console.log('AuthChatService: Google OAuth2 is loaded, proceeding with popup...');

      // Use Google OAuth popup instead of One Tap
      const client = (window as any).google.accounts.oauth2.initCodeClient({
        client_id: '368647547349-ispre03gps1ur9197q6eeut9c5uhdvci.apps.googleusercontent.com',
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response: any) => {
          console.log('AuthChatService: Google OAuth callback triggered!', response);
          
          try {
            // Send authorization code to backend
            const result = await fetch('http://localhost:4000/api/auth/google/exchange', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: response.code })
            });

            if (!result.ok) {
              throw new Error('Failed to exchange code for token');
            }

            const data = await result.json();
            console.log('AuthChatService: Backend response:', data);
            console.log('AuthChatService: Response success:', data.success);
            console.log('AuthChatService: Response tokens:', data.tokens);

            if (data.success) {
              // Store user data
              this.currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role
              };

              console.log('AuthChatService: Storing tokens:', {
                accessToken: data.tokens.accessToken,
                refreshToken: data.tokens.refreshToken
              });

              sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
              sessionStorage.setItem('accessToken', data.tokens.accessToken);
              sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
              
              // Verify storage
              console.log('AuthChatService: Verification - stored token:', sessionStorage.getItem('accessToken'));
              
              // Dispatch auth change event
              window.dispatchEvent(new CustomEvent('authChange'));
              
              console.log('AuthChatService: Google user logged in and saved to sessionStorage:', this.currentUser);

              // Redirect to dashboard
              window.history.pushState({}, '', '/dashboard');
              window.dispatchEvent(new PopStateEvent('popstate'));
              
            } else {
              throw new Error(data.error || 'Login failed');
            }
            
          } catch (error: any) {
            console.error('Google login error:', error);
            alert('Đăng nhập Google thất bại: ' + error.message);
          }
        }
      });

      console.log('AuthChatService: Google OAuth client initialized, requesting authorization...');

      // Request authorization code
      client.requestCode();
      console.log('AuthChatService: Google OAuth authorization requested successfully.');
      
    } catch (error: any) {
      console.error('AuthChatService: Google Sign-In initialization/prompt error:', error);
      alert('Không thể khởi tạo Google Sign-In: ' + error.message);
    }
  }

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
              
              // Trigger auth change event
              window.dispatchEvent(new CustomEvent('authChange'));
              
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
    return this.currentUser;
  }

  // Get access token
  static getToken() {
    // Try sessionStorage first, then localStorage
    let token = sessionStorage.getItem('accessToken');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    console.log('🔍 AuthChatService.getToken() called, returning:', token);
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
        return this.currentUser.role === 'admin';
      case '/agent':
        return this.currentUser.role === 'agent' || this.currentUser.role === 'admin';
      default:
        return true;
    }
  }

  // Initialize Socket.IO connection
  static connectSocket() {
    if (this.socket) return this.socket;

    // Real-time chat simulation between users
    this.socket = {
      connected: true,
      emit: (event: string, data: any) => {
        console.log(`Socket emit: ${event}`, data);
        
        if (event === 'sendMessage') {
          // Broadcast message to all connected users
          const message = {
            id: Date.now().toString(),
            content: data.content,
            sender: this.currentUser.name,
            senderId: this.currentUser.id,
            senderRole: this.currentUser.role,
            timestamp: new Date().toLocaleTimeString(),
            isUser: false // This will be set by the receiving component
          };
          
          // Simulate real-time broadcasting
          setTimeout(() => {
            this.messageHandlers.forEach(handler => {
              handler(message);
            });
          }, 100);
        }
      },
      on: (event: string, handler: (data: any) => void) => {
        if (event === 'message') {
          this.messageHandlers.push(handler);
        }
      },
      disconnect: () => {
        this.socket = null;
        this.messageHandlers = [];
      }
    };

    return this.socket;
  }

  // Send message
  static sendMessage(content: string) {
    if (!this.socket) {
      this.connectSocket();
    }
    
    this.socket.emit('sendMessage', {
      content,
      senderId: this.currentUser.id,
      senderRole: this.currentUser.role
    });
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
      case 'admin':
        return {
          title: 'Admin Dashboard',
          icon: '👑',
          color: '#dc2626',
          description: 'Quản lý toàn bộ hệ thống',
          permissions: ['Xem tất cả tickets', 'Phân công tickets', 'Xóa tickets', 'Xem analytics', 'Quản lý users', 'Truy cập admin panel']
        };
      case 'agent':
        return {
          title: 'Agent Dashboard',
          icon: '👨‍💼',
          color: '#2563eb',
          description: 'Hỗ trợ khách hàng',
          permissions: ['Xem tất cả tickets', 'Phân công tickets', 'Xem analytics', 'Chat với khách hàng']
        };
      case 'customer':
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
