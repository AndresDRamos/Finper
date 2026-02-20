-- Add 'savings' as a valid category type
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check
  CHECK (type IN ('expense', 'income', 'fixed_system', 'savings'));

-- Add manual income estimate fallback to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS manual_income_estimate numeric(12,2);
