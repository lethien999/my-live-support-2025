// Bot Responses mẫu cho các tình huống khác nhau
export class BotResponses {
  
  // Chào mừng lần đầu
  static getWelcomeMessage(shopName: string, customerName: string, productCategory: string): string {
    const responses = [
      `👋 Chào mừng ${customerName} đến với ${shopName}!

Cảm ơn bạn đã quan tâm đến sản phẩm ${productCategory} của chúng tôi. Tôi là AI Assistant và sẽ hỗ trợ bạn trong khi chờ nhân viên phản hồi.

Bạn có thể cho tôi biết bạn cần hỗ trợ gì không? 😊`,

      `🌟 Xin chào ${customerName}! 

Chào mừng bạn đến với ${shopName} - nơi cung cấp ${productCategory} chất lượng cao. Tôi là AI Assistant và sẵn sàng hỗ trợ bạn.

Nhân viên của chúng tôi sẽ phản hồi sớm nhất có thể. Trong thời gian chờ đợi, bạn có câu hỏi gì không? 🤔`,

      `🎉 Chào ${customerName}!

Cảm ơn bạn đã chọn ${shopName} cho nhu cầu ${productCategory} của mình. Tôi là AI Assistant và sẽ giúp bạn tìm hiểu về sản phẩm.

Bạn muốn biết thông tin gì về sản phẩm của chúng tôi? 💬`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Phản hồi cho câu hỏi về sản phẩm
  static getProductResponse(question: string, productCategory: string): string {
    const responses = [
      `Tôi hiểu bạn quan tâm đến ${productCategory}. Nhân viên của chúng tôi sẽ cung cấp thông tin chi tiết về sản phẩm sớm nhất có thể.

Bạn có thể cho tôi biết cụ thể hơn về nhu cầu của mình không? 🤔`,

      `Cảm ơn bạn đã hỏi về ${productCategory}! Nhân viên chuyên môn của chúng tôi sẽ tư vấn chi tiết cho bạn.

Trong thời gian chờ đợi, bạn có thể chia sẻ thêm về sở thích hoặc yêu cầu của mình không? 😊`,

      `Tuyệt vời! Bạn quan tâm đến ${productCategory}. Chúng tôi có nhiều sản phẩm đa dạng và chất lượng cao.

Nhân viên sẽ liên hệ với bạn sớm để tư vấn cụ thể. Bạn có câu hỏi nào khác không? 💡`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Phản hồi cho câu hỏi về giá
  static getPriceResponse(): string {
    const responses = [
      `Về giá cả, nhân viên của chúng tôi sẽ cung cấp báo giá chi tiết và ưu đãi tốt nhất cho bạn.

Bạn có thể cho tôi biết ngân sách dự kiến của mình không? 💰`,

      `Chúng tôi có nhiều mức giá phù hợp với mọi nhu cầu. Nhân viên sẽ tư vấn gói sản phẩm phù hợp nhất cho bạn.

Bạn quan tâm đến phân khúc giá nào? 🤔`,

      `Giá cả của chúng tôi rất cạnh tranh và có nhiều ưu đãi hấp dẫn. Nhân viên sẽ liên hệ để báo giá cụ thể.

Bạn có muốn biết về chương trình khuyến mãi hiện tại không? 🎁`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Phản hồi cho câu hỏi về giao hàng
  static getDeliveryResponse(): string {
    const responses = [
      `Chúng tôi giao hàng toàn quốc với nhiều phương thức vận chuyển. Nhân viên sẽ tư vấn chi tiết về thời gian và phí giao hàng.

Bạn ở khu vực nào? Tôi sẽ thông báo để nhân viên tư vấn cụ thể. 🚚`,

      `Chúng tôi có dịch vụ giao hàng nhanh và an toàn. Nhân viên sẽ cung cấp thông tin chi tiết về thời gian giao hàng.

Bạn có yêu cầu gì đặc biệt về giao hàng không? 📦`,

      `Giao hàng là thế mạnh của chúng tôi! Chúng tôi cam kết giao hàng đúng hẹn và đảm bảo chất lượng.

Nhân viên sẽ liên hệ để xác nhận địa chỉ và thời gian giao hàng phù hợp. Bạn có câu hỏi gì khác không? ⏰`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Phản hồi cho câu hỏi không xác định
  static getGeneralResponse(): string {
    const responses = [
      `Cảm ơn bạn đã liên hệ! Nhân viên của chúng tôi sẽ phản hồi chi tiết hơn sớm nhất có thể.

Bạn có câu hỏi nào khác không? 😊`,

      `Tôi hiểu câu hỏi của bạn. Nhân viên chuyên môn sẽ tư vấn cụ thể cho bạn.

Trong thời gian chờ đợi, bạn có thể chia sẻ thêm về nhu cầu của mình không? 🤔`,

      `Cảm ơn bạn đã quan tâm! Chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.

Bạn có muốn biết thêm thông tin gì không? 💬`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Phản hồi khi agent online
  static getAgentOnlineResponse(agentName: string): string {
    return `🎉 Tuyệt vời! ${agentName} đã online và sẽ hỗ trợ bạn ngay bây giờ.

Cảm ơn bạn đã kiên nhẫn chờ đợi! 😊`;
  }

  // Phản hồi khi không hiểu
  static getConfusedResponse(): string {
    const responses = [
      `Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể diễn đạt lại không?

Hoặc bạn có thể chờ nhân viên phản hồi để được hỗ trợ tốt nhất. 🤔`,

      `Tôi chưa nắm rõ ý của bạn. Bạn có thể giải thích thêm không?

Nhân viên của chúng tôi sẽ hiểu rõ hơn và hỗ trợ bạn tốt nhất. 😊`,

      `Xin lỗi, tôi cần thêm thông tin để hiểu rõ câu hỏi của bạn.

Bạn có thể mô tả cụ thể hơn không? Hoặc chờ nhân viên phản hồi. 💬`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Phân tích câu hỏi và trả về response phù hợp
  static analyzeAndRespond(message: string, context: any): string {
    const lowerMessage = message.toLowerCase();
    
    // Kiểm tra các từ khóa
    if (lowerMessage.includes('giá') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return this.getPriceResponse();
    }
    
    if (lowerMessage.includes('giao hàng') || lowerMessage.includes('delivery') || lowerMessage.includes('ship')) {
      return this.getDeliveryResponse();
    }
    
    if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('product') || lowerMessage.includes('hàng')) {
      return this.getProductResponse(message, context.productCategory || 'sản phẩm');
    }
    
    if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return this.getGeneralResponse();
    }
    
    // Mặc định
    return this.getGeneralResponse();
  }
}
