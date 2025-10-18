import React, { useState, useEffect } from 'react';
import AuthChatService from '../services/AuthChatService';
import { getApiUrl } from '../config/api';

interface Notification {
  NotificationID: number;
  UserID: number;
  Title: string;
  Message: string;
  Type: string;
  IsRead: boolean;
  ActionUrl?: string;
  CreatedAt: string;
  ReadAt?: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      console.log('NotificationsPage: Notifications updated, reloading...');
      loadNotifications();
    };
    
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = AuthChatService.getToken();
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xem thông báo');
      }

      const response = await fetch(getApiUrl('/api/notifications'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Không thể tải thông báo');
      // Fallback to mock data
      setNotifications([
        {
          NotificationID: 1,
          UserID: 3,
          Title: 'Order Delivered',
          Message: 'Your order ORD000001 has been delivered successfully!',
          Type: 'Success',
          IsRead: false,
          ActionUrl: '/orders/1',
          CreatedAt: new Date().toISOString()
        },
        {
          NotificationID: 2,
          UserID: 3,
          Title: 'New Product Available',
          Message: 'Check out our new wireless headphones!',
          Type: 'Info',
          IsRead: true,
          ActionUrl: '/products/13',
          CreatedAt: new Date().toISOString()
        },
        {
          NotificationID: 3,
          UserID: 3,
          Title: 'Payment Received',
          Message: 'Your payment for order ORD000002 has been received.',
          Type: 'Success',
          IsRead: false,
          ActionUrl: '/orders/2',
          CreatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = AuthChatService.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }

      const response = await fetch(getApiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.NotificationID === notificationId 
            ? { ...notif, IsRead: true, ReadAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.IsRead) {
      markAsRead(notification.NotificationID);
    }
    
    if (notification.ActionUrl) {
      window.location.href = notification.ActionUrl;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Success':
        return (
          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Warning':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'Error':
        return (
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Success':
        return 'bg-green-50 border-green-200';
      case 'Warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'Error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') {
      return !notif.IsRead;
    }
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.IsRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
          <p className="mt-2 text-gray-600">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'all'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'unread'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </nav>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'unread' 
                ? 'Tất cả thông báo đã được đọc.' 
                : 'Bạn sẽ nhận được thông báo khi có hoạt động mới.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.NotificationID}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  notification.IsRead 
                    ? 'bg-white border-gray-200 hover:bg-gray-50' 
                    : `${getTypeColor(notification.Type)} hover:shadow-md`
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getTypeIcon(notification.Type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        notification.IsRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                      }`}>
                        {notification.Title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.CreatedAt).toLocaleDateString('vi-VN')}
                        </span>
                        {!notification.IsRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className={`mt-1 text-sm ${
                      notification.IsRead ? 'text-gray-600' : 'text-gray-700'
                    }`}>
                      {notification.Message}
                    </p>
                    {notification.ActionUrl && (
                      <p className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                        Nhấn để xem chi tiết →
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
