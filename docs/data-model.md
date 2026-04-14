# Data Model

> Cargar cuando: features nuevas, queries complejas, relaciones entre tablas, entender enums o reglas de negocio.

## Entidades y campos clave

### Account
```ts
type: "credit" | "debit"
color: string        // hex, ej: "#3b82f6"
is_active: boolean   // filtrar: .eq("is_active", true)
```
- `credit_limit`, `cut_off_day`, `payment_due_day` solo aplican a `type: "credit"`.

### Category
```ts
type: "expense" | "income" | "fixed_system" | "savings"
icon: string   // kebab-case para lucide-react, ej: "shopping-cart"
color: string  // hex
is_active: boolean
```
- `fixed_system`: categorías de gastos fijos gestionadas internamente. **No mostrar en UI al usuario** → `.neq("type", "fixed_system")`.
- `savings`: exactamente 1 por usuario. Se usa en Budget separado.
- `icon` siempre es kebab-case. Render: `<DynamicIcon name={icon} />`. Ver `docs/ui-components.md`.

### Transaction
```ts
type: "expense" | "income"
transaction_date: string   // "YYYY-MM-DD" (date, NO timestamp)
amount: number
```
- Los gastos recurrentes son `FixedExpense`, no `Transaction`.
- Join típico: `select("*, account:accounts(*), category:categories(*)")`.

### FixedExpense
```ts
start_date: string    // "YYYY-MM-DD", requerido
end_date: string | null  // null = sin fecha de fin (indefinido)
```
- Query de activos en mes X:
  ```ts
  .lte("start_date", monthEnd)
  .or(`end_date.is.null,end_date.gte.${monthStart}`)
  ```
- `category_id` apunta a `type: "fixed_system"` categories.

### Budget
```ts
month_year: string      // "YYYY-MM" (NO date)
input_type: "percentage" | "absolute"
input_value: number     // valor como fue ingresado (% o monto)
amount: number          // monto absoluto calculado — usar para comparaciones
is_manual: boolean      // true si el usuario lo sobreescribió
```
- Budget para ahorro usa `category_id` → categoría `type: "savings"`.
- Presupuesto del mes nuevo: se copia del mes anterior si no existe (ver `src/app/(app)/budget/page.tsx` L74-88).

### UserSettings
```ts
savings_type: string
savings_percentage: number | null
savings_amount: number | null
manual_income_estimate: number | null  // override de avgIncome calculado
currency: string
```
- Exactamente 1 fila por usuario → usar `.single()`.

---

## Reglas de negocio implícitas

- **avgIncome**: suma de transactions `type: "income"` dividida entre cantidad de meses distintos. Solo últimos 3 meses anteriores al mes actual. Ver `src/app/(app)/page.tsx`.
- **Copia de budgets**: si el mes actual no tiene budgets → copiar del mes anterior con nuevo `month_year`. Ver `src/app/(app)/budget/page.tsx`.
- **Auto-seed de categorías**: al crear usuario, un trigger DB inserta categorías predefinidas (incluyendo `fixed_system` y `savings`). Ver migraciones en `supabase/migrations/`.
- **user_id scoping**: toda fila tiene `user_id`. RLS lo enforcea. Siempre filtrar o dejar que RLS actúe.
- **Nota legacy**: las categorías seedeadas por el trigger DB pueden tener emojis en `icon`. Todo código **nuevo** debe guardar kebab-case.

---

## Queries de referencia

```ts
// Transactions del mes
const { data } = await supabase
  .from("transactions")
  .select("*, account:accounts(*), category:categories(*)")
  .eq("user_id", user.id)
  .gte("transaction_date", monthStart)
  .lte("transaction_date", monthEnd)

// Categorías visibles para el usuario
const { data } = await supabase
  .from("categories")
  .select("*")
  .eq("user_id", user.id)
  .neq("type", "fixed_system")
  .eq("is_active", true)

// UserSettings
const { data } = await supabase
  .from("user_settings")
  .select("*")
  .eq("user_id", user.id)
  .single()
```
