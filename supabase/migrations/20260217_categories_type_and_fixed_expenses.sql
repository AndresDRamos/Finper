-- 1. Add type column to categories
ALTER TABLE categories ADD COLUMN type text DEFAULT 'expense' NOT NULL;

-- 2. Create fixed_expenses table
CREATE TABLE fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fixed_expenses"
  ON fixed_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Remove is_fixed from transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS is_fixed;

-- 4. Update handle_new_user trigger to seed fixed_system and income categories
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- user_settings
  INSERT INTO user_settings (user_id) VALUES (NEW.id);

  -- fixed_system categories
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Suscripción', '📦', '#8b5cf6', 'fixed_system'),
    (NEW.id, 'Servicio', '⚡', '#f97316', 'fixed_system');

  -- income categories
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Nómina', '💵', '#22c55e', 'income'),
    (NEW.id, 'Aguinaldo', '🎁', '#f59e0b', 'income'),
    (NEW.id, 'Fondo de ahorro', '🏦', '#3b82f6', 'income');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
