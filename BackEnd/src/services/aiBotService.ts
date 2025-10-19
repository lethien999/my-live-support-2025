// AI Bot Service for Backend - Tích hợp Gemini AI
export class AIBotService {
  private static apiKey: string = 'AIzaSyBvxL5IKR5EQN5ZRPDaV9RYWKIZcfx3_SM';
  private static baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  // Gửi tin nhắn đến AI bot và nhận phản hồi
  static async sendMessage(message: string, context?: {
    shopName?: string;
    customerName?: string;
    isFirstMessage?: boolean;
    productCategory?: string;
    roomId?: string;
  }): Promise<string> {
    try {
      console.log('🤖 AI Bot: Processing message:', message);
      
      // Tạo prompt dựa trên context
      const prompt = this.createPrompt(message, context);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không thể phản hồi lúc này.';
      
      console.log('🤖 AI Bot: Response:', botResponse);
      return botResponse;
      
    } catch (error) {
      console.error('🤖 AI Bot: Error:', error);
      return this.getFallbackResponse(context, message);
    }
  }

  // Tạo prompt phù hợp với context
  private static createPrompt(message: string, context?: any): string {
    const shopName = context?.shopName || 'MUJI Store';
    const customerName = context?.customerName || 'bạn';
    const isFirstMessage = context?.isFirstMessage || false;
    const productCategory = context?.productCategory || 'sản phẩm nội thất và đồ dùng gia đình';

    if (isFirstMessage) {
      return `Bạn là AI assistant của ${shopName}, một cửa hàng bán ${productCategory} chất lượng cao. 
      
Khách hàng ${customerName} vừa vào chat lần đầu. Hãy chào mừng họ một cách thân thiện và chuyên nghiệp.

Nhiệm vụ của bạn:
1. Chào mừng khách hàng đến với ${shopName}
2. Giới thiệu ngắn gọn về cửa hàng và sản phẩm ${productCategory}
3. Hỏi khách hàng cần hỗ trợ gì
4. Thông báo rằng nhân viên sẽ phản hồi sớm nhất có thể
5. Giữ giọng điệu thân thiện, chuyên nghiệp, và hữu ích
6. Sử dụng emoji phù hợp để tạo cảm giác thân thiện

Tin nhắn của khách hàng: "${message}"

Hãy phản hồi bằng tiếng Việt, ngắn gọn (dưới 150 từ), và phù hợp với văn hóa Việt Nam.`;
    } else {
      return `Bạn là AI assistant của ${shopName}, một cửa hàng bán ${productCategory} chất lượng cao.

Khách hàng ${customerName} đang hỏi: "${message}"

Nhiệm vụ của bạn:
1. Trả lời câu hỏi một cách hữu ích và chính xác
2. Nếu không biết câu trả lời, hãy thừa nhận và đề xuất liên hệ nhân viên
3. Luôn giữ giọng điệu thân thiện và chuyên nghiệp
4. Thông báo rằng nhân viên sẽ phản hồi chi tiết hơn
5. Sử dụng emoji phù hợp để tạo cảm giác thân thiện

Hãy phản hồi bằng tiếng Việt, ngắn gọn (dưới 100 từ), và phù hợp với văn hóa Việt Nam.`;
    }
  }

  // Phản hồi dự phòng khi AI API lỗi
  private static getFallbackResponse(context?: any, message?: string): string {
    const shopName = context?.shopName || 'MUJI Store';
    const customerName = context?.customerName || 'bạn';
    const isFirstMessage = context?.isFirstMessage || false;

    if (isFirstMessage) {
      return `👋 Chào mừng ${customerName} đến với ${shopName}!

Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi. Tôi là AI Assistant và sẽ hỗ trợ bạn trong khi chờ nhân viên phản hồi.

Bạn có thể cho tôi biết bạn cần hỗ trợ gì không? 😊`;
    } else {
      return `Cảm ơn bạn đã liên hệ! Nhân viên của chúng tôi sẽ phản hồi chi tiết hơn sớm nhất có thể.

Bạn có câu hỏi nào khác không? 😊`;
    }
  }

  // Kiểm tra xem có nên sử dụng bot không
  static shouldUseBot(context: {
    isFirstMessage: boolean;
    lastMessageTime?: Date;
    agentOnline?: boolean;
    senderRole?: string;
  }): boolean {
    // Không sử dụng bot nếu người gửi là agent hoặc admin
    if (context.senderRole === 'Agent' || context.senderRole === 'Admin') {
      return false;
    }

    // Sử dụng bot nếu:
    // 1. Là tin nhắn đầu tiên
    // 2. Agent không online
    // 3. Tin nhắn cuối từ agent quá lâu (> 5 phút)
    
    if (context.isFirstMessage) return true;
    if (!context.agentOnline) return true;
    
    if (context.lastMessageTime) {
      const now = new Date();
      const timeDiff = now.getTime() - context.lastMessageTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      return minutesDiff > 5; // 5 phút
    }
    
    return false;
  }

  // Tạo tin nhắn bot
  static createBotMessage(content: string, roomId: string): any {
    return {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      senderId: 'bot',
      senderName: 'AI Assistant',
      senderRole: 'Bot',
      roomId,
      timestamp: new Date().toISOString(),
      type: 'text',
      isBot: true
    };
  }
}
