export enum UserRole {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  ADMIN = 'admin',
}

export enum TicketStatus {
  OPEN = 'Open',
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  SYSTEM = 'system',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId: string;
  assigneeId?: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  ticketId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  fileId?: string;
  createdAt: Date;
}

export interface FileAsset {
  id: string;
  filename: string;
  mime: string;
  size: number;
  url: string;
  uploaderId: string;
  createdAt: Date;
}

export interface Rating {
  id: string;
  ticketId: string;
  score: number;
  comment?: string;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
