# Auth Flow

> Cargar cuando: nuevas rutas, Server Actions que necesiten user_id, cambios en sesión o middleware.

## Los tres clients de Supabase

| Client | Archivo | Usar en |
|--------|---------|---------|
| Browser | `src/lib/supabase/client.ts` | Client Components (`"use client"`) — formularios, event handlers |
| Server | `src/lib/supabase/server.ts` | Server Components, Server Actions (`async page.tsx`, layouts) |
| Middleware | `src/lib/supabase/middleware.ts` | Solo en `src/middleware.ts` — no importar en otro lugar |

**Diferencia clave**: `client.ts` usa `createBrowserClient`, `server.ts` usa `createServerClient` con cookie jar. No son intercambiables.

---

## Obtener user_id

**En Server Component / Server Action** (importar de `server.ts`):
```ts
import { createClient } from "@/lib/supabase/server"

const supabase = await createClient()   // await requerido
const { data: { user } } = await supabase.auth.getUser()
// user.id disponible — nunca null aquí (layout ya guard)
```

**En Client Component** (importar de `client.ts`):
```ts
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()   // sin await
const { data: { user } } = await supabase.auth.getUser()
```

---

## Flujo de sesión

```
Request → middleware.ts (updateSession, refresca tokens)
       → (app)/layout.tsx (getUser() server-side, redirect("/login") si no hay sesión)
       → page.tsx (sesión garantizada, user_id disponible)
```

1. `src/middleware.ts` llama `updateSession()` en cada request para refrescar tokens JWT.
2. `src/app/(app)/layout.tsx` hace `getUser()` y redirige a `/login` si no hay sesión.
3. Todas las rutas bajo `(app)/` están protegidas automáticamente por el layout.
4. Las rutas bajo `(auth)/` son públicas (excluidas en el matcher del middleware).

---

## Agregar nueva ruta protegida

Solo colocar el archivo en `src/app/(app)/`. El layout guard la cubre automáticamente. No se necesita verificación adicional en el `page.tsx`.

Si el Server Component necesita `user_id`:
```ts
// src/app/(app)/mi-nueva-ruta/page.tsx
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // user.id garantizado — el layout redirige si no hay sesión
  
  const { data } = await supabase.from("tabla").select("*").eq("user_id", user!.id)
  // ...
}
```

---

## Callback OAuth

`src/app/auth/callback/route.ts` — maneja el intercambio de código OAuth de Supabase. No modificar a menos que cambies el provider de autenticación.
