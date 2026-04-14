# CLAUDE.md

Índice y routing table para agentes. Lee los archivos `docs/` según tu tarea.

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `git branch` / `git status` — verificar estado antes y después de cambios
- `git push origin <branch>` — Vercel auto-deploys en push a `master`

## Routing Table

Lee **solo** los docs relevantes a tu tarea:

| Tarea | Doc a leer |
|-------|-----------|
| Crear/editar formulario, Server Action, insertar/actualizar datos | [docs/patterns.md](docs/patterns.md) |
| Nueva página con fetch, queries, joins, Promise.all | [docs/patterns.md](docs/patterns.md) |
| Entender entidades, campos, relaciones entre tablas | [docs/data-model.md](docs/data-model.md) |
| Lógica de Budget, FixedExpense, Category types | [docs/data-model.md](docs/data-model.md) |
| Usar DynamicIcon, shadcn, Sheet, layout, colores | [docs/ui-components.md](docs/ui-components.md) |
| Agregar componente UI, cambio visual, dark mode | [docs/ui-components.md](docs/ui-components.md) |
| Crear tabla, ALTER TABLE, RLS policy, migration SQL | [docs/database.md](docs/database.md) |
| Nueva ruta, Server Action con user_id, flujo de sesión | [docs/auth.md](docs/auth.md) |

## Stack

Next.js 16 App Router · React 19 · TypeScript 5 · Supabase SSR · Tailwind CSS 4 · shadcn/ui (new-york) · lucide-react · sonner · recharts · PWA

## Rutas principales

- `src/app/(auth)/` — login, register (públicas)
- `src/app/(app)/` — dashboard, accounts, transactions, budget (protegidas)
- `src/app/auth/callback/` — OAuth callback
- `src/components/` — componentes compartidos
- `src/lib/types.ts` — todos los tipos TypeScript centralizados
- `src/lib/supabase/` — client.ts · server.ts · middleware.ts
- `supabase/migrations/` — SQL migrations

## Reglas críticas (siempre aplican)

1. **DynamicIcon**: `Category.icon` es kebab-case. SIEMPRE `<DynamicIcon name={icon} />`. NUNCA emoji ni string crudo.
2. **Path alias**: `@/` mapea a `src/`.
3. **shadcn/ui**: `src/components/ui/` — NO editar manualmente. Usar `npx shadcn add`.
4. **UI**: dark mode only · mobile-first · UI en español.
5. **DB scoping**: toda fila tiene `user_id` — siempre user-scoped.

## Variables de entorno

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Auto-actualización de docs (obligatorio al terminar)

Antes de cerrar la sesión, revisa si tu implementación modificó alguna de estas áreas y actualiza el doc correspondiente:

| Si cambiaste... | Actualiza |
|----------------|-----------|
| Patrón de formulario, fetch, Server Action o month range | [docs/patterns.md](docs/patterns.md) |
| Schema de entidades, campos, enums o reglas de negocio | [docs/data-model.md](docs/data-model.md) |
| Componentes UI, DynamicIcon, layout, shadcn, colores | [docs/ui-components.md](docs/ui-components.md) |
| Tablas SQL, RLS policies, triggers, migrations | [docs/database.md](docs/database.md) |
| Auth flow, clientes Supabase, rutas protegidas | [docs/auth.md](docs/auth.md) |

Mantén cada archivo dentro de su longitud recomendada (~50-90 líneas). Si crece demasiado, consolida en lugar de expandir.
