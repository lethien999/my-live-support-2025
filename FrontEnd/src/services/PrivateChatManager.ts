// Private Chat Manager for Individual Customer Support
class PrivateChatManager {
  private static instance: PrivateChatManager;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private connectedUsers: Map<string, any> = new Map();
  private activeChats: Map<string, { customerId: string, agentId: string | null, messages: any[], status: string }> = new Map();
  private storageKey = 'live_support_private_chats';
  private chatStoragePrefix = 'private_chat_';

  static getInstance(): PrivateChatManager {
    if (!PrivateChatManager.instance) {
      PrivateChatManager.instance = new PrivateChatManager();
      PrivateChatManager.instance.loadFromStorage();
      PrivateChatManager.instance.setupStorageListener();
    }
    return PrivateChatManager.instance;
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.connectedUsers = new Map(data.users || []);
        this.activeChats = new Map(data.activeChats || []);
      }
      
      // Load individual chat histories
      this.loadChatHistories();
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  // Load individual chat histories
  private loadChatHistories() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.chatStoragePrefix)) {
          const chatId = key.replace(this.chatStoragePrefix, '');
          const chatData = localStorage.getItem(key);
          if (chatData) {
            const chat = JSON.parse(chatData);
            this.activeChats.set(chatId, chat);
            console.log(`Loaded chat ${chatId}: ${chat.messages.length} messages`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading chat histories:', error);
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      const data = {
        users: Array.from(this.connectedUsers.entries()),
        activeChats: Array.from(this.activeChats.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Save individual chat history
  private saveChatHistory(chatId: string, chat: any) {
    try {
      const key = `${this.chatStoragePrefix}${chatId}`;
      localStorage.setItem(key, JSON.stringify(chat));
      console.log(`Saved chat ${chatId}: ${chat.messages.length} messages`);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  // Trigger storage event to notify other tabs
  private triggerStorageEvent(eventType: string, data: any) {
    try {
      const eventData = {
        type: eventType,
        data: data,
        timestamp: Date.now()
      };
      
      // Use a dummy localStorage key to trigger storage event
      const eventKey = `private_chat_event_${Date.now()}`;
      localStorage.setItem(eventKey, JSON.stringify(eventData));
      
      // Remove immediately to avoid clutter
      setTimeout(() => {
        localStorage.removeItem(eventKey);
      }, 100);
      
      console.log(`PrivateChatManager: Triggered storage event: ${eventType}`);
    } catch (error) {
      console.error('Error triggering storage event:', error);
    }
  }

  // Listen for storage changes from other tabs
  private setupStorageListener() {
    window.addEventListener('storage', (e) => {
      // Handle chat changes
      if (e.key && e.key.startsWith(this.chatStoragePrefix) && e.newValue) {
        try {
          const chatId = e.key.replace(this.chatStoragePrefix, '');
          const chat = JSON.parse(e.newValue);
          
          // Update active chats
          this.activeChats.set(chatId, chat);
          
          // Notify handlers for users in this chat
          if (chat.customerId && this.messageHandlers.has(chat.customerId)) {
            const handler = this.messageHandlers.get(chat.customerId);
            if (handler && chat.messages.length > 0) {
              const latestMessage = chat.messages[chat.messages.length - 1];
              handler(latestMessage);
            }
          }
          
          if (chat.agentId && this.messageHandlers.has(chat.agentId)) {
            const handler = this.messageHandlers.get(chat.agentId);
            if (handler && chat.messages.length > 0) {
              const latestMessage = chat.messages[chat.messages.length - 1];
              handler(latestMessage);
            }
          }
        } catch (error) {
          console.error('Error handling storage change:', error);
        }
      }
      
      // Handle custom events
      if (e.key && e.key.startsWith('private_chat_event_') && e.newValue) {
        try {
          const eventData = JSON.parse(e.newValue);
          console.log('PrivateChatManager: Received storage event:', eventData.type);
          
          if (eventData.type === 'user_registered') {
            // Refresh connected users for all tabs
            console.log('PrivateChatManager: User registered event received');
          }
        } catch (error) {
          console.error('Error handling custom storage event:', error);
        }
      }
    });
  }

  // Register user and get their chat
  registerUser(userId: string, user: any, messageHandler: (message: any) => void) {
    console.log(`PrivateChatManager: Registering user ${userId} (${user.name}, ${user.role})`);
    
    this.connectedUsers.set(userId, user);
    this.messageHandlers.set(userId, messageHandler);
    
    console.log(`User ${user.name} (${user.role}) registered`);
    
    // If customer, create or get their chat
    if (user.role === 'customer') {
      console.log(`Creating/ensuring chat for customer ${userId}`);
      this.ensureCustomerChat(userId);
    }
    
    this.saveToStorage();
    
    // Trigger storage event to notify other tabs
    this.triggerStorageEvent('user_registered', { userId, user });
  }

  // Ensure customer has a chat (create if not exists)
  private ensureCustomerChat(customerId: string) {
    const existingChat = Array.from(this.activeChats.values())
      .find(chat => chat.customerId === customerId);
    
    if (!existingChat) {
      const chatId = `chat_${customerId}_${Date.now()}`;
      const newChat = {
        customerId,
        agentId: null, // Will be assigned when agent joins
        messages: [],
        createdAt: new Date().toISOString(),
        status: 'waiting' // waiting, active, closed
      };
      
      this.activeChats.set(chatId, newChat);
      this.saveChatHistory(chatId, newChat);
      
      console.log(`Created new chat for customer ${customerId}`);
    }
  }

  // Get customer's chat
  getCustomerChat(customerId: string) {
    return Array.from(this.activeChats.values())
      .find(chat => chat.customerId === customerId);
  }

  // Get available chats for agents
  getAvailableChats() {
    return Array.from(this.activeChats.values())
      .filter(chat => chat.status === 'waiting' || chat.status === 'active');
  }

  // Assign agent to customer chat
  assignAgentToChat(customerId: string, agentId: string) {
    const chat = this.getCustomerChat(customerId);
    if (chat) {
      chat.agentId = agentId;
      chat.status = 'active';
      
      const chatId = Array.from(this.activeChats.entries())
        .find(([_id, c]) => c.customerId === customerId)?.[0];
      
      if (chatId) {
        this.activeChats.set(chatId, chat);
        this.saveChatHistory(chatId, chat);
        
        // Don't send system message for agent assignment
        console.log(`Agent ${agentId} assigned to customer ${customerId}`);
      }
    }
  }

  // Send message in private chat
  sendMessage(senderId: string, content: string, targetUserId?: string) {
    const sender = this.connectedUsers.get(senderId);
    if (!sender) return;

    // Determine chat based on sender role
    let chat;
    if (sender.role === 'customer') {
      chat = this.getCustomerChat(senderId);
    } else if (sender.role === 'agent' && targetUserId) {
      chat = this.getCustomerChat(targetUserId);
    } else {
      console.error('Invalid message context');
      return;
    }

    if (!chat) {
      console.error('Chat not found');
      return;
    }

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

    // Add message to chat
    chat.messages.push(message);
    
    // Find chat ID
    const chatId = Array.from(this.activeChats.entries())
      .find(([_id, c]) => c.customerId === chat.customerId)?.[0];
    
    if (chatId) {
      this.activeChats.set(chatId, chat);
      this.saveChatHistory(chatId, chat);
      
      // Notify participants
      const customerHandler = this.messageHandlers.get(chat.customerId);
      if (customerHandler && chat.customerId !== senderId) {
        setTimeout(() => {
          customerHandler({ ...message, isUser: false });
        }, 50);
      }
      
      if (chat.agentId) {
        const agentHandler = this.messageHandlers.get(chat.agentId);
        if (agentHandler && chat.agentId !== senderId) {
          setTimeout(() => {
            agentHandler({ ...message, isUser: false });
          }, 50);
        }
      }
      
      console.log(`Message sent in chat ${chatId}: ${content}`);
    }
  }


  // Get chat messages for user
  getChatMessages(userId: string) {
    console.log(`PrivateChatManager: Getting chat messages for user ${userId}`);
    
    const user = this.connectedUsers.get(userId);
    console.log(`PrivateChatManager: User found:`, user);
    
    if (!user) {
      console.log(`PrivateChatManager: User ${userId} not found`);
      return [];
    }

    if (user.role === 'customer') {
      const chat = this.getCustomerChat(userId);
      console.log(`PrivateChatManager: Customer chat:`, chat);
      return chat ? chat.messages : [];
    } else if (user.role === 'agent') {
      // Return messages from all assigned chats
      const agentChats = Array.from(this.activeChats.values())
        .filter(chat => chat.agentId === userId);
      
      console.log(`PrivateChatManager: Agent chats:`, agentChats);
      return agentChats.flatMap(chat => chat.messages);
    }

    console.log(`PrivateChatManager: Unknown role ${user.role}`);
    return [];
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Get available customers for agents
  getAvailableCustomers() {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.role === 'customer')
      .map(customer => ({
        ...customer,
        chat: this.getCustomerChat(customer.id)
      }));
  }

  // Unregister user
  unregisterUser(userId: string) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.connectedUsers.delete(userId);
      this.messageHandlers.delete(userId);
      
      // If agent leaves, unassign from chats
      if (user.role === 'agent') {
        Array.from(this.activeChats.values()).forEach(chat => {
          if (chat.agentId === userId) {
            chat.agentId = null;
            chat.status = 'waiting';
            
            const chatId = Array.from(this.activeChats.entries())
              .find(([_id, c]) => c.customerId === chat.customerId)?.[0];
            
            if (chatId) {
              this.activeChats.set(chatId, chat);
              this.saveChatHistory(chatId, chat);
              // Don't send system message for agent leaving
              console.log(`Agent ${userId} left chat for customer ${chat.customerId}`);
            }
          }
        });
      }
      
      console.log(`${user.name} (${user.role}) đã rời khỏi chat`);
    }
    
    this.saveToStorage();
  }

  // Close chat
  closeChat(customerId: string) {
    const chat = this.getCustomerChat(customerId);
    if (chat) {
      chat.status = 'closed';
      
      const chatId = Array.from(this.activeChats.entries())
        .find(([_id, c]) => c.customerId === customerId)?.[0];
      
      if (chatId) {
        this.activeChats.set(chatId, chat);
        this.saveChatHistory(chatId, chat);
        // Don't send system message for chat closure
        console.log(`Chat closed for customer ${customerId}`);
      }
    }
  }
}

export default PrivateChatManager;
