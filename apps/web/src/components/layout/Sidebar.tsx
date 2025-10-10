import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MessageCircle, Ticket, Users, Settings, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageCircle, roles: ['customer'] },
    { name: 'Agent Chat', href: '/agent/chat', icon: MessageCircle, roles: ['agent', 'admin'] },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    { name: 'Admin', href: '/admin', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-48'
    }`}>
      <div className="flex flex-col h-full pt-16">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${
                  isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {sidebarOpen && item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
