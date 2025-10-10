export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:4000/ws',
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;

export const ROLES = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;

export const TICKET_STATUS = {
  OPEN: 'Open',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
} as const;

export const TICKET_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

export const MESSAGE_TYPE = {
  TEXT: 'text',
  FILE: 'file',
  SYSTEM: 'system',
} as const;
