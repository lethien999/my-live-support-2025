// Auto Token Sync Service
// This will automatically sync tokens between frontend and backend

class TokenSyncService {
  private static instance: TokenSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  
  static getInstance(): TokenSyncService {
    if (!TokenSyncService.instance) {
      TokenSyncService.instance = new TokenSyncService();
    }
    return TokenSyncService.instance;
  }
  
  // Start auto sync
  startAutoSync() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(async () => {
      await this.syncToken();
    }, 30000); // Sync every 30 seconds
    
    console.log('🔄 Token auto-sync started');
  }
  
  // Stop auto sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('⏹️ Token auto-sync stopped');
  }
  
  // Sync token with backend
  private async syncToken() {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) return;
      
      // Test token with backend
      const response = await fetch('http://localhost:4000/api/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log('🔄 Token expired, attempting refresh...');
        await this.refreshToken();
      }
    } catch (error) {
      console.log('🔄 Token sync error:', error);
    }
  }
  
  // Refresh token
  private async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return;
      }
      
      const response = await fetch('http://localhost:4000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('accessToken', data.accessToken);
        console.log('✅ Token refreshed successfully');
      } else {
        console.log('❌ Token refresh failed, redirecting to login');
        this.redirectToLogin();
      }
    } catch (error) {
      console.log('❌ Token refresh error:', error);
      this.redirectToLogin();
    }
  }
  
  // Redirect to login
  private redirectToLogin() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    window.location.href = '/login';
  }
  
  // Manual token validation
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:4000/api/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Auto-start token sync
const tokenSync = TokenSyncService.getInstance();
tokenSync.startAutoSync();

// Export for manual use
(window as any).TokenSyncService = TokenSyncService;
