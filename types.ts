
export enum ViewState {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  SALES = 'SALES',
  PRODUCTS = 'PRODUCTS',
  ADD_PRODUCT = 'ADD_PRODUCT',
  IMPORT_PRODUCT = 'IMPORT_PRODUCT',
  ADD_EXPENSE = 'ADD_EXPENSE',
  CURRENT_ACCOUNT = 'CURRENT_ACCOUNT',
  WORKSHOP = 'WORKSHOP',
  PAYMENTS = 'PAYMENTS'
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
  price: number; // Purchase Price
  transport: number;
  sale: number; // Sale Price
  date: string;
  stock?: number; // Current calculated stock
}

export interface StockMovement {
  id: number;
  productId: number;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: 'PROVISION' | 'SALE_DAILY' | 'SALE_CONTRACT' | 'ADJUSTMENT' | 'WORKSHOP_OUTPUT';
  referenceId?: string; // ID of the sale if applicable
}

export interface DailySale {
  id: number;
  productId: number;
  quantity: number;
  method: 'CASH' | 'DIGITAL';
  total: number;
  date: string;
  destinationAccountId?: number; // ID of the bank account or 'CASH'
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
  name: string; // User alias for the account
  accountNumber: string;
  amount: number;
}

export interface PaymentRecord {
    id: number;
    amount: number;
    description: string;
    date: string;
    sourceAccountId: number | 'CASH'; // Where the money came from
}
