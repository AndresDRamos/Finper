# Database: Migraciones y RLS

> Cargar cuando: crear tablas nuevas, ALTER TABLE, escribir RLS policies, aplicar migrations.

## Archivos de migración

- **Ubicación**: `supabase/migrations/`
- **Naming**: `YYYYMMDD_descripcion_corta.sql`
- **Regla**: usar `IF NOT EXISTS` / `IF EXISTS` para idempotencia
- **Aplicar**:
  - Via MCP: `mcp__supabase__apply_migration`
  - Via CLI: `npx supabase db push`

---

## Template: nueva tabla

```sql
CREATE TABLE IF NOT EXISTS nombre_tabla (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- campos de negocio aquí
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nombre_tabla"
  ON nombre_tabla FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Template: modificar tabla existente

```sql
-- Agregar columna
ALTER TABLE tabla ADD COLUMN IF NOT EXISTS campo tipo DEFAULT valor;

-- Eliminar columna
ALTER TABLE tabla DROP COLUMN IF EXISTS campo;

-- Agregar índice
CREATE INDEX IF NOT EXISTS idx_tabla_campo ON tabla(campo);
```

---

## Tablas actuales del proyecto

| Tabla | Descripción |
|-------|-------------|
| `auth.users` | Gestionada por Supabase |
| `accounts` | Cuentas bancarias/tarjetas del usuario |
| `categories` | Categorías con type enum y icon kebab-case |
| `transactions` | Movimientos individuales (expense/income) |
| `fixed_expenses` | Gastos recurrentes con start/end date |
| `budgets` | Presupuestos por categoría y mes (YYYY-MM) |
| `user_settings` | 1 fila por usuario, configuración de ahorro |

Hay un **trigger** `handle_new_user()` que al registrar un nuevo usuario:
1. Crea la fila en `user_settings`
2. Inserta categorías predefinidas (incluyendo `fixed_system` y `savings`)

---

## Tipos SQL usados en este proyecto

| Tipo SQL | Uso |
|----------|-----|
| `uuid` | IDs, `gen_random_uuid()` como default |
| `numeric(12,2)` | Montos: `amount`, `credit_limit`, etc. |
| `text` | Strings y enums textuales (`'expense'`, `'income'`) |
| `date` | `transaction_date`, `start_date`, `end_date` |
| `timestamptz` | `created_at`, `updated_at` |
| `boolean` | `is_active`, `is_manual` |

---

## RLS: patrón consistente

Todas las tablas usan el mismo patrón de policy:
```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```
Siempre habilitar RLS **antes** de crear policies. No crear policies parciales (solo SELECT o solo INSERT) — usar `FOR ALL` salvo necesidad específica.
