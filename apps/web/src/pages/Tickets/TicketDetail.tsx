import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User, Calendar } from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết Ticket #{id}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <p className="mt-1 text-gray-900">Không thể đăng nhập vào tài khoản</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <p className="mt-1 text-gray-900">
                  Tôi đã thử đăng nhập nhiều lần nhưng vẫn không thành công. 
                  Có thể bạn giúp tôi kiểm tra vấn đề này không?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Open
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Độ ưu tiên</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    High
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Cuộc trò chuyện</h2>
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có tin nhắn nào
              </h3>
              <p className="text-gray-600">
                Tính năng chat sẽ được phát triển trong phiên bản tiếp theo.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin khách hàng</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Customer User</p>
                <p className="text-sm text-gray-600">user@demo.io</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tạo lúc:</span>
                <span className="text-gray-900">10/10/2025 20:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cập nhật:</span>
                <span className="text-gray-900">10/10/2025 20:30</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Hành động</h3>
            <div className="space-y-3">
              <button className="w-full btn btn-primary">Gán cho agent</button>
              <button className="w-full btn btn-secondary">Cập nhật trạng thái</button>
              <button className="w-full btn btn-danger">Đóng ticket</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
