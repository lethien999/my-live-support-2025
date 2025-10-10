import React from 'react';
import { Ticket, Plus, Search, Filter } from 'lucide-react';

export const TicketsList: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Ticket</h1>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Tạo ticket mới
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ticket..."
              className="input pl-10"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-6">
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có ticket nào
            </h3>
            <p className="text-gray-600 mb-6">
              Tính năng quản lý ticket sẽ được phát triển trong phiên bản tiếp theo.
            </p>
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tạo ticket đầu tiên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
