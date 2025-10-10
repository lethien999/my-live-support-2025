import React from 'react';
import { Users, MessageCircle, Ticket, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
              <p className="text-2xl font-semibold text-gray-900">4</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Ticket className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket mở</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tin nhắn hôm nay</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đánh giá TB</p>
              <p className="text-2xl font-semibold text-gray-900">4.5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Ticket gần đây</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Không thể đăng nhập</p>
                <p className="text-sm text-gray-600">user@demo.io</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Open
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Cần hỗ trợ giá</p>
                <p className="text-sm text-gray-600">user@demo.io</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Pending
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Thống kê hệ thống</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Agent online:</span>
              <span className="font-medium text-gray-900">2/2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thời gian phản hồi TB:</span>
              <span className="font-medium text-gray-900">2 phút</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tỷ lệ giải quyết:</span>
              <span className="font-medium text-gray-900">95%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khách hàng hài lòng:</span>
              <span className="font-medium text-gray-900">92%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
