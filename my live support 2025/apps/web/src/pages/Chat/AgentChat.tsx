import React from 'react';
import { MessageCircle, Users, Clock } from 'lucide-react';

export const AgentChat: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="card p-6">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Tính năng chat cho agent sẽ được phát triển trong phiên bản tiếp theo.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Khách hàng chờ</h3>
              <p className="text-sm text-green-700">0 người</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Thời gian phản hồi</h3>
              <p className="text-sm text-blue-700">Trung bình 2 phút</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Tin nhắn hôm nay</h3>
              <p className="text-sm text-purple-700">0 tin nhắn</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Agent có thể xem danh sách ticket và chat với khách hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
