# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, Next.js preset)
- No test framework configured

## Architecture

**Finper** is a personal finance PWA (Spanish-language) built with Next.js 16 (App Router), Supabase auth/database, Tailwind CSS 4, and shadcn/ui (new-york style).

### Route Groups

- `(auth)/` — Public pages: login, register
- `(app)/` — Authenticated pages: dashboard, accounts, transactions, categories, budget, settings
- `auth/callback/` — Supabase OAuth callback route

### Auth Flow

Supabase SSR auth with middleware-based session refresh (`src/lib/supabase/middleware.ts`). Unauthenticated users are redirected to `/login`. The `(app)/layout.tsx` also guards routes server-side via `getUser()`.

Three Supabase client variants:
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/server.ts` — Server Component / Server Action client
- `src/lib/supabase/middleware.ts` — Middleware client for session refresh

### Data Model (src/lib/types.ts)

Core entities: Account (credit/debit), Category (expense/income/fixed_system/savings), Transaction, FixedExpense, Budget, UserSettings. All rows are user-scoped (`user_id`). SQL migrations live in `supabase/migrations/`.

### UI

- shadcn/ui components in `src/components/ui/` (do not edit manually — use `npx shadcn add`)
- App-level components in `src/components/` (BottomNav, MonthPicker)
- Feature components colocated with their route (e.g., `accounts/account-form.tsx`)
- Icons: lucide-react
- Toasts: sonner

### Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Conventions

- Dark mode only (`<html lang="es" className="dark">`)
- Mobile-first layout with bottom navigation, max-w-lg centered content
- Path aliases: `@/` maps to `src/`
- Server Actions pattern for data mutations (colocated in page/component files)
