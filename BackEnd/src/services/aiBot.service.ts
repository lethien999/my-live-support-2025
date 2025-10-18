import sql from 'mssql';
import logger from '@/config/logger';

// Database configuration
const dbConfig = {
  user: 'thien',
  password: '1909',
  server: 'localhost',
  database: 'live_support',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export class AIBotService {
  private responses = {
    greeting: [
      'Xin chào! Tôi có thể giúp gì cho bạn?',
      'Chào bạn! Bạn cần hỗ trợ gì?',
      'Xin chào! Tôi ở đây để hỗ trợ bạn.'
    ],
    product: [
      'Chúng tôi có nhiều sản phẩm chất lượng cao. Bạn quan tâm đến sản phẩm nào?',
      'Tôi có thể tư vấn về các sản phẩm phù hợp với nhu cầu của bạn.',
      'Bạn muốn biết thông tin chi tiết về sản phẩm nào?'
    ],
    pricing: [
      'Giá cả của chúng tôi rất cạnh tranh. Bạn có thể xem bảng giá trên website.',
      'Tôi sẽ chuyển bạn đến chuyên viên tư vấn về giá.',
      'Chúng tôi có nhiều gói dịch vụ với giá khác nhau.'
    ],
    technical: [
      'Tôi sẽ chuyển bạn đến bộ phận kỹ thuật để được hỗ trợ chuyên sâu.',
      'Vấn đề kỹ thuật này cần được xử lý bởi chuyên viên.',
      'Tôi đã ghi nhận vấn đề của bạn và sẽ có người liên hệ sớm.'
    ],
    default: [
      'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
      'Tôi đã ghi nhận yêu cầu của bạn.',
      'Chuyên viên sẽ liên hệ với bạn trong thời gian sớm nhất.'
    ]
  };

  async processMessage(roomId: string, message: string, senderRole: string) {
    try {
      // Chỉ phản hồi khi không phải admin/agent
      if (senderRole === 'admin' || senderRole === 'agent') {
        return null;
      }

      // Phân tích tin nhắn để chọn phản hồi phù hợp
      const response = this.generateResponse(message);
      
      // Tạo tin nhắn bot
      await sql.connect(dbConfig);
      
      const messageResult = await sql.query`
        INSERT INTO Messages (RoomID, SenderID, MessageType, Content, CreatedAt, IsRead)
        VALUES (${parseInt(roomId)}, 999, 'text', ${response}, GETDATE(), 0);
        SELECT SCOPE_IDENTITY() as MessageID;
      `;
      
      const messageId = messageResult.recordset[0].MessageID;
      
      const botMessage = {
        id: messageId.toString(),
        roomId: roomId,
        senderId: '999', // Bot system ID
        type: 'text',
        content: response,
        createdAt: new Date().toISOString(),
        sender: {
          id: '999',
          name: 'AI Bot',
          role: 'Bot'
        }
      };

      logger.info('AI Bot response sent', { 
        roomId, 
        messageId: botMessage.id,
        response 
      });

      return botMessage;
    } catch (error) {
      logger.error('AI Bot error:', error);
      return null;
    }
  }

  private generateResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Phân loại tin nhắn
    if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('xin chào')) {
      return this.getRandomResponse('greeting');
    }
    
    if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('product') || lowerMessage.includes('mua')) {
      return this.getRandomResponse('product');
    }
    
    if (lowerMessage.includes('giá') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return this.getRandomResponse('pricing');
    }
    
    if (lowerMessage.includes('lỗi') || lowerMessage.includes('bug') || lowerMessage.includes('kỹ thuật')) {
      return this.getRandomResponse('technical');
    }
    
    return this.getRandomResponse('default');
  }

  private getRandomResponse(category: keyof typeof this.responses): string {
    const responses = this.responses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Tạo user bot trong database
  async createBotUser() {
    try {
      await sql.connect(dbConfig);
      
      // Check if bot user exists
      const existingUser = await sql.query`
        SELECT UserID FROM Users WHERE Email = 'bot@system.ai'
      `;
      
      if (existingUser.recordset.length === 0) {
        // Create bot user
        await sql.query`
          INSERT INTO Users (Email, PasswordHash, FullName, Status, CreatedAt)
          VALUES ('bot@system.ai', 'bot-password', 'AI Assistant', 'Active', GETDATE())
        `;
        logger.info('AI Bot user created');
      } else {
        logger.info('AI Bot user already exists');
      }
      
      return true;
    } catch (error) {
      logger.error('Error creating bot user:', error);
      return false;
    }
  }
}

export const aiBotService = new AIBotService();
