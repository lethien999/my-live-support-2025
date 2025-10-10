import React from 'react';
import { MessageCircle, Users, Clock } from 'lucide-react';

export const CustomerChat: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat với hỗ trợ</h1>
          <p className="text-gray-600 mb-6">
            Tính năng chat realtime sẽ được phát triển trong phiên bản tiếp theo.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Agent sẵn sàng</h3>
              <p className="text-sm text-blue-700">Hỗ trợ 24/7</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Phản hồi nhanh</h3>
              <p className="text-sm text-green-700">Trong vòng vài phút</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Chat realtime</h3>
              <p className="text-sm text-purple-700">Giao tiếp trực tiếp</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Để sử dụng tính năng chat, vui lòng tạo ticket hỗ trợ trước.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
