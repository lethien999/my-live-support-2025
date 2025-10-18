// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'http://localhost:4000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REFRESH: '/api/auth/refresh',
      LOGOUT: '/api/auth/logout',
    },
    CHAT: {
      SEND: '/api/chat/send',
      ROOMS: '/api/chat/rooms',
      MESSAGES: '/api/chat/messages',
    },
    TICKETS: '/api/tickets',
    DEPARTMENTS: '/api/departments',
    AGENTS: '/api/agents',
    CATEGORIES: '/api/categories',
    PRODUCTS: '/api/products',
    ORDERS: '/api/orders',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
