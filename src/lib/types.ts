export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: "credit" | "debit";
  account_number: string | null;
  credit_limit: number | null;
  cut_off_day: number | null;
  payment_due_day: number | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "expense" | "income" | "fixed_system";
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: "expense" | "income";
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
  // joined
  account?: Account;
  category?: Category;
};

export type FixedExpense = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  // joined
  account?: Account;
  category?: Category;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  month_year: string;
  amount: number;
  input_type: "percentage" | "absolute";
  input_value: number | null;
  is_manual: boolean;
  created_at: string;
  // joined
  category?: Category;
};

export type UserSettings = {
  id: string;
  user_id: string;
  savings_percentage: number;
  savings_type: "percentage" | "absolute";
  savings_amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
};
