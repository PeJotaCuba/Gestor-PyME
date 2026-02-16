
export enum ViewState {
  AUTH = 'AUTH',
  DEV_PANEL = 'DEV_PANEL',
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  SALES = 'SALES',
  PRODUCTS = 'PRODUCTS',
  ADD_PRODUCT = 'ADD_PRODUCT',
  IMPORT_PRODUCT = 'IMPORT_PRODUCT',
  ADD_EXPENSE = 'ADD_EXPENSE',
  CURRENT_ACCOUNT = 'CURRENT_ACCOUNT',
  WORKSHOP = 'WORKSHOP',
  PAYMENTS = 'PAYMENTS',
  CHAT = 'CHAT',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED'
}

export enum UserRole {
  LEADER = 'LEADER',
  ASSISTANT = 'ASSISTANT',
  DEVELOPER = 'DEVELOPER'
}

export interface CloudUser {
    uid?: string;
    username: string;
    password?: string;
    phone: string;
    licenseKey: string;
    role: UserRole;
    name: string;
    businessName?: string; // New field
    firstLogin?: any;
    trialUntil?: any;
    linkedLeaderId?: string;
    licenseValidated?: boolean;
    activeSessions?: string[]; // Array of deviceIds
}

export interface BusinessProfile {
  name: string;
  currency: string;
  type: 'retail' | 'wholesale' | 'mixed';
}

export interface Product {
  id: number;
  name: string;
  category?: string;
  price: number;
  transport: number;
  sale: number;
  date: string;
  stock?: number;
}

export interface StockMovement {
  id: number;
  productId: number;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: 'PROVISION' | 'SALE_DAILY' | 'SALE_CONTRACT' | 'ADJUSTMENT' | 'WORKSHOP_OUTPUT';
  referenceId?: string;
}

export interface DailySale {
  id: number;
  productId: number;
  quantity: number;
  method: 'CASH' | 'DIGITAL';
  total: number;
  date: string;
  destinationAccountId?: number;
}

export interface ContractSale {
  id: number;
  clientName: string;
  productId: number;
  quantity: number;
  total: number;
  date: string;
  status: 'PENDING' | 'PAID';
  destinationAccountId?: number;
}

export interface BankAccount {
  id: number;
  bankName: 'BANMET' | 'BANDEC' | 'BPA';
  name: string;
  accountNumber: string;
  amount: number;
}

export interface PaymentRecord {
    id: number;
    amount: number;
    description: string;
    date: string;
    sourceAccountId: number | 'CASH';
}

/**
 * Chat Message structure
 */
export interface Message {
    id?: string;
    senderId: string;
    senderName: string;
    type: 'text' | 'file';
    content: string;
    timestamp: any;
    fileUrl?: string;
    fileName?: string;
}
