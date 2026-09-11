export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string;
  barcode: string;
  category_id: string;
  warehouse_id: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  minimum_stock: number;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  supplier_id: string;
  document_number: string;
  purchase_date: string;
  total_amount: number;
  discount: number;
  tax: number;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  customer_id: string;
  document_number: string;
  sale_date: string;
  total_amount: number;
  discount: number;
  tax: number;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  user_id: string;
  product_id: string;
  movement_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reference_id: string;
  reference_type: string;
  movement_date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  income_date: string;
  description: string;
  created_at: string;
  updated_at: string;
}
