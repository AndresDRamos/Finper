# Patterns: Data, Mutations y Forms

> Cargar cuando: crear/editar formularios, Server Actions, nuevas páginas con fetch, cualquier interacción con Supabase.

## Server Action / Mutation Pattern

**Desde un Client Component** (formulario que inserta/actualiza datos):

```ts
"use client"
import { createClient } from "@/lib/supabase/client"   // browser client
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const supabase = createClient()  // sin await
const { data: { user } } = await supabase.auth.getUser()

const { error } = await supabase.from("tabla").insert({
  user_id: user!.id,
  campo: valor,
})

if (error) {
  toast.error(error.message)
  return
}

toast.success("Guardado")
router.refresh()   // revalida Server Components del layout actual
onClose()          // cierra modal/sheet
```

**Diferencia client.ts vs server.ts**:
- `client.ts` → `createClient()` sin await, para Client Components
- `server.ts` → `await createClient()`, para Server Components y Server Actions (`"use server"`)

---

## Client Component Form Pattern

Esquema unificado create/edit (patrón de `account-form.tsx`):

```ts
"use client"

interface Props {
  item?: Entity      // undefined = modo create, definido = modo edit
  onClose: () => void
}

export function EntityForm({ item, onClose }: Props) {
  const [campo, setCampo] = useState(item?.campo ?? "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const payload = { campo, user_id: user!.id }
    const { error } = item
      ? await supabase.from("tabla").update(payload).eq("id", item.id)
      : await supabase.from("tabla").insert(payload)

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(item ? "Actualizado" : "Creado")
    router.refresh()
    onClose()
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

---

## Data Fetching Pattern

**Server Component** con fetch paralelo:

```ts
// src/app/(app)/mi-pagina/page.tsx
import { createClient } from "@/lib/supabase/server"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>  // Next.js 16: searchParams es Promise
}) {
  const { month } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Siempre Promise.all() para 2+ queries
  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase.from("tabla").select("*, category:categories(*)").eq("user_id", user!.id),
    supabase.from("categories").select("*").eq("user_id", user!.id),
  ])

  return <ClientComponent items={items ?? []} categories={categories ?? []} />
}
```

- `Promise.all()` es **obligatorio** para 2+ queries — no encadenar awaits secuenciales.
- Los datos se pasan como props al Client Component — no hacer fetch en el cliente si ya están disponibles desde el servidor.

---

## Month Range Pattern

```ts
// Calcular rango desde "YYYY-MM"
const monthYear = searchParams?.month ?? new Date().toISOString().slice(0, 7)
const [year, month] = monthYear.split("-").map(Number)
const monthStart = `${monthYear}-01`
const monthEnd = new Date(year, month, 0).toISOString().split("T")[0]  // último día del mes

// Transactions del mes
.gte("transaction_date", monthStart)
.lte("transaction_date", monthEnd)

// Fixed expenses activos en el mes
.lte("start_date", monthEnd)
.or(`end_date.is.null,end_date.gte.${monthStart}`)
```

---

## Filter + Sort Pattern (listas cliente)

Para listas con filtros y ordenamiento sin fetch adicional — filtrar con `useMemo` sobre datos ya cargados por el Server Component. Patrón de `transactions-list.tsx`:

```ts
type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category"

interface FilterState {
  categories: string[]  // ids seleccionados
  accounts: string[]
  dateFrom: string      // "YYYY-MM-DD" o ""
  dateTo: string
  amountMin: string
  amountMax: string
}

const filtered = useMemo(() => {
  return items
    .filter(item => /* aplicar FilterState */)
    .sort(/* aplicar SortOption */)
}, [items, filters, sortBy])
```

- El panel de filtros usa un `Sheet` con `side="bottom"`
- No hacer re-fetch al filtrar — operar sobre los datos recibidos como props
- Mostrar contador de filtros activos en el botón trigger para UX
