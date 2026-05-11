# Plan: Rediseño visual de la vista de Presupuestos

## Objetivo

Mejorar la UX de `src/app/(app)/budget/budget-config.tsx` simplificando la interacción y mostrando información financiera más clara al usuario.

---

## Cambios solicitados

### 1. Mostrar "Presupuesto restante por asignar"

**Archivo:** `budget-config.tsx`

**Qué hacer:**
- Agregar un indicador visible (badge o card pequeña) que muestre:
  - `Restante por presupuestar: $X` = `netIncome - totalAllocated`
- Ubicarlo justo debajo del card de "Ingreso neto disponible" o como parte del header de "Categorías de gasto".
- Usar color verde si `restante >= 0`, rojo si `restante < 0`.

**Dato ya disponible:** `netIncome - totalAllocated` (ambas variables ya existen en el componente, líneas 100 y 131-134).

---

### 2. Mostrar gasto real por presupuesto en cada card de categoría

**Archivo:** `budget-config.tsx`

**Qué hacer:**
- Ya se muestra `$spent / $budget` en texto (línea 382). Mantener este texto pero hacerlo más prominente.
- Considerar mostrar el gasto como texto con color semántico:
  - Verde: `spent < 80% del budget`
  - Amarillo: `spent >= 80%`
  - Rojo: `spent > 100%`
- Esto reemplaza visualmente a la barra de progreso que se elimina.

---

### 3. Eliminar la barra de progreso horizontal (`<Progress>`)

**Archivo:** `budget-config.tsx`

**Qué hacer:**
- Eliminar el bloque de líneas 436-440:
  ```tsx
  {budgetAmt > 0 && (
    <Progress value={Math.min(pct, 100)} ... />
  )}
  ```
- Eliminar el import de `Progress` (línea 6).
- El feedback visual de gasto vs presupuesto lo dará el color del texto del punto 2.

---

### 4. Eliminar el toggle `% / $` (`ModeToggle`)

**Archivo:** `budget-config.tsx`

**Qué hacer:**
- Eliminar el componente `ModeToggle` completo (líneas 508-527).
- Eliminar todas las referencias a `ModeToggle` en el JSX:
  - En el ahorro (línea 311): eliminar `<ModeToggle mode={savingsMode} ...>`
  - En cada categoría (líneas 412-415): eliminar `<ModeToggle mode={state.inputMode} ...>`
- Simplificar el tipo `InputMode` → ya no se necesita. Hardcodear `input_type: "absolute"` en el payload de guardado.
- Eliminar estado `savingsMode` y `state.inputMode` — siempre `"absolute"`.
- Limpiar `resolvedAmounts`: eliminar la rama de cálculo por porcentaje (línea 110). Siempre usar el valor directo.

**Impacto en datos:**
- En `handleSave()`, siempre guardar `input_type: "absolute"`.
- Los budgets existentes con `input_type: "percentage"` se migran implícitamente al guardar: su `amount` calculado ya está en la DB, y al re-guardar se escribe como absolute.

---

### 5. Comportamiento del input de monto

**Archivo:** `budget-config.tsx`

**Lógica nueva para `onChange` del input de cada categoría:**

| Acción del usuario | `inputValue` | `isManual` | Monto resultante |
|---|---|---|---|
| Escribe un número (ej: `500`) | `"500"` | `true` | `500` |
| Escribe `0` | `"0"` | `true` | `0` (presupuesto cero explícito) |
| Borra el input (queda vacío) | `""` | `false` | Auto = `restante / categorías_auto` |

**Cambio clave vs actual:** Hoy `isManual` se setea con `e.target.value !== ""`. Esto ya cubre el caso: vacío → auto. Pero hay que asegurar que `"0"` se trate como manual (ya lo hace porque `"0" !== ""`). **No requiere cambio de lógica**, solo verificar y documentar.

**Placeholder del input:** Mostrar el valor auto-calculado como placeholder cuando está vacío:
```
placeholder={`${autoAmount.toLocaleString()} (auto)`}
```
Esto ya existe (línea 401), solo asegurar que se mantenga.

---

## Resumen de archivos a modificar

| Archivo | Cambios |
|---|---|
| `src/app/(app)/budget/budget-config.tsx` | Todos los cambios descritos arriba |

No se requieren cambios en la DB, server actions, ni page.tsx.

---

## Orden de implementación sugerido

1. Eliminar `ModeToggle` y simplificar a solo montos absolutos
2. Eliminar `<Progress>` bars
3. Agregar colores semánticos al texto de gasto
4. Agregar indicador de "Restante por presupuestar"
5. Verificar comportamiento del input (0 vs vacío)
6. Probar y ajustar visualmente

---

## Notas

- No se modifica el tab de "Ingresos" — solo afecta el tab de "Gastos".
- El ahorro mensual también pierde el toggle `% / $` y pasa a ser solo monto absoluto.
- Mantener el badge "Auto" en categorías sin monto manual.
