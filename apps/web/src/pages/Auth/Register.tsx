import React from 'react';
import { Link } from 'react-router-dom';

export const Register: React.FC = () => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Đăng ký</h2>
      <p className="text-gray-600 mb-6">
        Tính năng đăng ký sẽ được phát triển trong phiên bản tiếp theo.
      </p>
      <Link to="/auth/login" className="btn btn-primary">
        Quay lại đăng nhập
      </Link>
    </div>
  );
};
