export enum ViewState {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  ADD_PRODUCT = 'ADD_PRODUCT',
  IMPORT_PRODUCT = 'IMPORT_PRODUCT',
  ADD_EXPENSE = 'ADD_EXPENSE',
}

export interface BusinessProfile {
  name: string;
  currency: string;
  type: 'retail' | 'wholesale' | 'mixed';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  freightCost: number;
  taxPercent: number;
  salePrice: number;
  stock: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  frequency: 'daily' | 'monthly' | 'weekly';
  isFixed: boolean;
  prorationMethod: 'value' | 'units' | 'weight';
}
