export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'agent' | 'admin';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  customerId: string;
  assigneeId?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  assignee?: User;
  department?: Department;
  _count?: {
    messages: number;
  };
}

export interface Department {
  id: string;
  name: string;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'file' | 'system';
  content: string;
  fileId?: string;
  createdAt: string;
  sender?: User;
  file?: FileAsset;
}

export interface FileAsset {
  id: string;
  filename: string;
  mime: string;
  size: number;
  url: string;
  uploaderId: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  ticketId: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
