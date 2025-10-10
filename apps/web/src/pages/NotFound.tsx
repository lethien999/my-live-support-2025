import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertCircle className="h-24 w-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Trang không tìm thấy
        </h2>
        <p className="text-gray-600 mb-8">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại.
        </p>
        <Link
          to="/"
          className="btn btn-primary px-6 py-3"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
};
