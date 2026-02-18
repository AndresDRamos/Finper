-- Add savings_type and savings_amount to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS savings_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS savings_amount numeric(12,2);

-- Add budget input tracking fields
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS input_type text DEFAULT 'absolute',
  ADD COLUMN IF NOT EXISTS input_value numeric(12,2),
  ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false;
