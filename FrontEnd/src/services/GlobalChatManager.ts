// Global Chat Manager for Real-time Communication
class GlobalChatManager {
  private static instance: GlobalChatManager;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private connectedUsers: Map<string, any> = new Map();
  private messageHistory: any[] = [];
  private userChatHistory: Map<string, any[]> = new Map(); // Per-user chat history
  private storageKey = 'live_support_chat';
  private userStoragePrefix = 'user_chat_';
  private lastSystemMessage: { [key: string]: number } = {};

  static getInstance(): GlobalChatManager {
    if (!GlobalChatManager.instance) {
      GlobalChatManager.instance = new GlobalChatManager();
      GlobalChatManager.instance.loadFromStorage();
      GlobalChatManager.instance.setupStorageListener();
    }
    return GlobalChatManager.instance;
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.messageHistory = data.messages || [];
        this.connectedUsers = new Map(data.users || []);
        this.userChatHistory = new Map(data.userChatHistory || []);
      }
      
      // Load individual user chat histories
      this.loadUserChatHistories();
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  // Load individual user chat histories
  private loadUserChatHistories() {
    try {
      // Get all localStorage keys that start with userStoragePrefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.userStoragePrefix)) {
          const userId = key.replace(this.userStoragePrefix, '');
          const userData = localStorage.getItem(key);
          if (userData) {
            const messages = JSON.parse(userData);
            this.userChatHistory.set(userId, messages);
            console.log(`Loaded chat history for user ${userId}: ${messages.length} messages`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user chat histories:', error);
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      const data = {
        messages: this.messageHistory,
        users: Array.from(this.connectedUsers.entries()),
        userChatHistory: Array.from(this.userChatHistory.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Save individual user chat history
  private saveUserChatHistory(userId: string, messages: any[]) {
    try {
      const key = `${this.userStoragePrefix}${userId}`;
      localStorage.setItem(key, JSON.stringify(messages));
      console.log(`Saved chat history for user ${userId}: ${messages.length} messages`);
    } catch (error) {
      console.error('Error saving user chat history:', error);
    }
  }

  // Listen for storage changes from other tabs
  private setupStorageListener() {
    window.addEventListener('storage', (e) => {
      // Listen for user-specific chat history changes
      if (e.key && e.key.startsWith(this.userStoragePrefix) && e.newValue) {
        try {
          const userId = e.key.replace(this.userStoragePrefix, '');
          const messages = JSON.parse(e.newValue);
          
          // Update user chat history
          this.userChatHistory.set(userId, messages);
          
          // Notify all handlers for this user
          const handler = this.messageHandlers.get(userId);
          if (handler && messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            // Only notify if it's not from the current user (to avoid duplicates)
            if (latestMessage.senderId !== userId) {
              setTimeout(() => {
                handler(latestMessage);
              }, 100);
            }
          }
        } catch (error) {
          console.error('Error parsing user storage data:', error);
        }
      }
    });
  }

  // Register a user session
  registerUser(userId: string, user: any, messageHandler: (message: any) => void) {
    const wasAlreadyConnected = this.connectedUsers.has(userId);
    
    this.connectedUsers.set(userId, user);
    this.messageHandlers.set(userId, messageHandler);
    
    console.log(`User ${user.name} (${user.role}) joined chat`);
    console.log(`Total connected users: ${this.connectedUsers.size}`);
    
    // Save to storage
    this.saveToStorage();
    
    // Only send join message if user wasn't already connected
    if (!wasAlreadyConnected) {
      this.broadcastSystemMessage(`${user.name} (${user.role}) đã tham gia chat`);
    }
  }

  // Unregister a user session
  unregisterUser(userId: string) {
    const user = this.connectedUsers.get(userId);
    const wasConnected = this.connectedUsers.has(userId);
    
    this.connectedUsers.delete(userId);
    this.messageHandlers.delete(userId);
    
    console.log(`User ${userId} left chat`);
    console.log(`Total connected users: ${this.connectedUsers.size}`);
    
    // Save to storage
    this.saveToStorage();
    
    // Only send leave message if user was actually connected
    if (wasConnected && user) {
      this.broadcastSystemMessage(`${user.name} (${user.role}) đã rời khỏi chat`);
    }
  }

  // Send message from one user to all others
  sendMessage(senderId: string, content: string) {
    const sender = this.connectedUsers.get(senderId);
    if (!sender) return;

    const messageId = Date.now().toString();
    const message = {
      id: messageId,
      content,
      sender: sender.name,
      senderId: sender.id,
      senderRole: sender.role,
      timestamp: new Date().toLocaleTimeString(),
      isUser: false // Will be set by receiving component
    };

    // Add to global history
    this.messageHistory.push(message);
    
    // Add to sender's personal history (mark as sent by user)
    const senderHistory = this.userChatHistory.get(senderId) || [];
    const senderMessage = { ...message, isUser: true };
    senderHistory.push(senderMessage);
    this.userChatHistory.set(senderId, senderHistory);
    this.saveUserChatHistory(senderId, senderHistory);
    
    // Add to all other users' histories (mark as received)
    this.connectedUsers.forEach((_user, userId) => {
      if (userId !== senderId) {
        const userHistory = this.userChatHistory.get(userId) || [];
        const receivedMessage = { ...message, isUser: false };
        
        // Check if message already exists to avoid duplicates
        const exists = userHistory.some(msg => msg.id === messageId);
        if (!exists) {
          userHistory.push(receivedMessage);
          this.userChatHistory.set(userId, userHistory);
          this.saveUserChatHistory(userId, userHistory);
        }
      }
    });
    
    // Save to storage
    this.saveToStorage();

    // Broadcast to all connected users except sender
    this.messageHandlers.forEach((handler, userId) => {
      if (userId !== senderId) {
        setTimeout(() => {
          handler(message);
        }, 50);
      }
    });

    console.log(`Message from ${sender.name}: ${content}`);
    console.log(`Saved to ${this.connectedUsers.size} user histories`);
  }

  // Broadcast system message with throttling
  broadcastSystemMessage(content: string) {
    const now = Date.now();
    const messageKey = content;
    
    // Throttle system messages - only send if 5 seconds have passed since last similar message
    if (this.lastSystemMessage[messageKey] && (now - this.lastSystemMessage[messageKey]) < 5000) {
      console.log('Throttling system message:', content);
      return;
    }
    
    this.lastSystemMessage[messageKey] = now;
    
    const message = {
      id: Date.now().toString(),
      content,
      sender: 'System',
      senderId: 'system',
      senderRole: 'system',
      timestamp: new Date().toLocaleTimeString(),
      isUser: false
    };

    this.messageHistory.push(message);
    
    // Save to storage
    this.saveToStorage();

    this.messageHandlers.forEach((handler) => {
      setTimeout(() => {
        handler(message);
      }, 50);
    });
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Get message history
  getMessageHistory() {
    return this.messageHistory;
  }

  // Get message history for a specific user
  getUserChatHistory(userId: string): any[] {
    return this.userChatHistory.get(userId) || [];
  }

  // Get all users with chat history
  getAllUsersWithHistory(): { userId: string, userName: string, userRole: string, messageCount: number }[] {
    const users: any[] = [];
    this.userChatHistory.forEach((messages, userId) => {
      const user = this.connectedUsers.get(userId);
      if (user) {
        users.push({
          userId,
          userName: user.name,
          userRole: user.role,
          messageCount: messages.length
        });
      }
    });
    return users.sort((a, b) => b.messageCount - a.messageCount);
  }

  // Clear chat history for a specific user
  clearUserChatHistory(userId: string) {
    this.userChatHistory.delete(userId);
    const key = `${this.userStoragePrefix}${userId}`;
    localStorage.removeItem(key);
    console.log(`Cleared chat history for user ${userId}`);
  }

  // Clear all user chat histories
  clearAllUserChatHistories() {
    this.userChatHistory.clear();
    
    // Remove all user-specific storage keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.userStoragePrefix)) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('Cleared all user chat histories');
  }
}

export default GlobalChatManager;
