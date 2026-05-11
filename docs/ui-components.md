# UI Components & Conventions

> Cargar cuando: crear/modificar componentes, nuevas páginas, cambios visuales, uso de iconos o shadcn.

## DynamicIcon — Regla Crítica

`Category.icon` almacena un kebab-case string (ej: `"shopping-cart"`).

```tsx
// CORRECTO — código nuevo
import { DynamicIcon } from "@/components/dynamic-icon"
<DynamicIcon name={category.icon} />

// Con fallback para categorías legacy que aún tienen emoji en DB
<DynamicIcon name={category.icon} size={16} fallback={<span>{category.icon}</span>} />

// INCORRECTO — nunca hacer esto en código nuevo
<span>{category.icon}</span>   // renderiza el string crudo
```

Cómo funciona: convierte kebab-case → PascalCase → lookup en `icons` de lucide-react. Acepta todas las props de un icono lucide (`size`, `className`, `strokeWidth`, etc.).

**Nota legacy**: categorías seedeadas por trigger DB pueden tener emojis en `icon`. Usar `fallback` al renderizar categorías no creadas por el usuario (ej: en `budget-config.tsx`).

---

## Componentes compartidos (`src/components/`)

| Componente | Usar cuando |
| --- | --- |
| `bottom-nav.tsx` | No tocar — solo en `(app)/layout.tsx`. 4 tabs: Inicio, Movimientos, Cuentas, Presupuestos |
| `dynamic-icon.tsx` | Renderizar cualquier `Category.icon` o icono dinámico de DB |
| `icon-picker.tsx` | Formularios donde el usuario elige icono — usado en `budget/category-form-modal.tsx` |
| `month-picker.tsx` | Selector de mes (YYYY-MM). Usado en transactions y budget |
| `new-transaction-modal.tsx` | Modal unificado de crear/editar. 2 pasos al crear (tipo → formulario), directo al editar. Soporta transacciones y gastos fijos. Incluye eliminación. Exporta `TransactionEditing` type |
| `new-transaction-fab.tsx` | FAB que abre el modal en modo creación. Incluir en cada página de la app (`transactions`, `accounts`, `budget`) pasando `accounts` y `categories` como props |

---

## shadcn/ui

- Componentes en `src/components/ui/` — **NO editar manualmente**
- Añadir componentes nuevos: `npx shadcn add <nombre>`
- Estilo configurado: `new-york`
- Importar: `@/components/ui/<nombre>`
- Componentes disponibles: badge, button, card, dialog, input, label, select, separator, sheet, tabs

---

## Layout Constraints

```tsx
// Estructura típica de página en (app)/
<div className="max-w-lg mx-auto px-4 pb-20">
  {/* pb-20: espacio para el bottom nav */}
  {/* contenido */}
</div>
```

- **Dark mode only**: `<html className="dark">` en root layout — no añadir `ThemeProvider` ni toggles
- **Mobile-first**: max-w-lg centered, diseño para pantallas pequeñas primero
- **Bottom nav**: consume ~80px al fondo → siempre `pb-20` en el wrapper de contenido
- **Toaster**: ya incluido en `(app)/layout.tsx` → solo usar `toast()` de sonner, no añadir otro `<Toaster />`
- **Fonts/meta**: configurados en `src/app/layout.tsx` (root) — no duplicar

---

## Formularios en Sheet (modal móvil)

Patrón estándar para formularios en mobile:

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Título</SheetTitle>
    </SheetHeader>
    <EntityForm onClose={() => setOpen(false)} />
  </SheetContent>
</Sheet>
```

---

## Colores de categorías / cuentas

- Formato en DB: hex string (`color: string | null`)
- Paleta usada en el proyecto:

  ```text
  #3b82f6  #ef4444  #22c55e  #f59e0b
  #8b5cf6  #ec4899  #06b6d4  #f97316
  ```
- Renderizar inline: `style={{ color: category.color }}` o `style={{ backgroundColor: category.color }}`
- Cuando `color` es null → usar fallback `#6b7280` (gray-500)

---

## Recharts (gráficos)

Ya instalado (`recharts`). Usado en budget page. Componentes en Client Components (`"use client"`).
