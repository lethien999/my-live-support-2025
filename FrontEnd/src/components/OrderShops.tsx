import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface Shop {
  ShopID: number;
  ShopName: string;
  ShopCode: string;
  ContactEmail: string;
  ContactPhone: string;
  ItemCount: number;
  ShopTotal: number;
  ShopOrderStatus: string;
}

interface OrderShopsProps {
  orderId: string;
  onShopSelect: (shop: Shop) => void;
}

const OrderShops: React.FC<OrderShopsProps> = ({ orderId, onShopSelect }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderShops();
  }, [orderId]);

  const loadOrderShops = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiUrl(`/api/orders/${orderId}/shops`), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load order shops');
      }

      const data = await response.json();
      
      if (data.success) {
        setShops(data.shops);
      } else {
        throw new Error(data.error || 'Failed to load shops');
      }
    } catch (error: any) {
      console.error('Error loading order shops:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    onShopSelect(shop);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải danh sách shop...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">❌ Lỗi: {error}</p>
        <button 
          onClick={loadOrderShops}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Không tìm thấy shop nào cho đơn hàng này</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🏪 Chọn shop để liên hệ
      </h3>
      
      {shops.map((shop) => (
        <div
          key={shop.ShopID}
          onClick={() => handleShopSelect(shop)}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{shop.ShopName}</h4>
              <p className="text-sm text-gray-600">Mã: {shop.ShopCode}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>📦 {shop.ItemCount} sản phẩm</span>
                <span>💰 {shop.ShopTotal.toLocaleString('vi-VN')} VND</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  shop.ShopOrderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  shop.ShopOrderStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                  shop.ShopOrderStatus === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {shop.ShopOrderStatus}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                💬 Liên hệ
              </button>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>📧 {shop.ContactEmail}</p>
            <p>📞 {shop.ContactPhone}</p>
          </div>
        </div>
      ))}
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Lưu ý:</strong> Mỗi shop sẽ có phòng chat riêng để hỗ trợ về sản phẩm của shop đó.
        </p>
      </div>
    </div>
  );
};

export default OrderShops;
