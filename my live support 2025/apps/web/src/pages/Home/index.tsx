import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Shield, Zap } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Live Support System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Hệ thống hỗ trợ khách hàng trực tuyến với chat realtime, 
            quản lý ticket và đánh giá dịch vụ chuyên nghiệp.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/auth/login"
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Đăng nhập
            </Link>
            <Link
              to="/auth/register"
              className="btn btn-secondary px-8 py-3 text-lg"
            >
              Đăng ký
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="card p-6 text-center">
            <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat Realtime</h3>
            <p className="text-gray-600">
              Giao tiếp trực tiếp với khách hàng qua WebSocket
            </p>
          </div>

          <div className="card p-6 text-center">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quản lý Ticket</h3>
            <p className="text-gray-600">
              Theo dõi và xử lý yêu cầu hỗ trợ hiệu quả
            </p>
          </div>

          <div className="card p-6 text-center">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Bảo mật</h3>
            <p className="text-gray-600">
              Xác thực JWT và phân quyền RBAC an toàn
            </p>
          </div>

          <div className="card p-6 text-center">
            <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hiệu suất cao</h3>
            <p className="text-gray-600">
              Kiến trúc hiện đại với React và Node.js
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Tài khoản demo
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Admin</h3>
              <p className="text-sm text-gray-600 mb-2">admin@demo.io</p>
              <p className="text-sm text-gray-500">admin123</p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Agent</h3>
              <p className="text-sm text-gray-600 mb-2">agent1@demo.io</p>
              <p className="text-sm text-gray-500">agent123</p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Customer</h3>
              <p className="text-sm text-gray-600 mb-2">user@demo.io</p>
              <p className="text-sm text-gray-500">user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
