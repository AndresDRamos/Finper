"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Budget, Category } from "@/lib/types";

// ── Fuente para los data-labels numéricos de las barras ───────────────────────
// Cambia este valor para experimentar: "Aptos Narrow", "Inter", "monospace", etc.
const DATA_LABEL_FONT = "Aptos Narrow, Arial Narrow, sans-serif";
// ──────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type SortKey = "usage" | "remaining" | "spent" | "budgeted";
type SortDir = "desc" | "asc";

const SORT_LABELS: Record<SortKey, string> = {
  usage: "Uso de presupuesto",
  remaining: "Monto Restante",
  spent: "Monto Gastado",
  budgeted: "Monto Asignado",
};

export function BudgetBars({
  expenseCategories,
  monthBudgets,
  spentMap,
}: {
  expenseCategories: Category[];
  monthBudgets: Budget[];
  spentMap: Record<string, number>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("usage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    const budgetMap: Record<string, number> = {};
    monthBudgets.forEach((b) => {
      budgetMap[b.category_id] = Number(b.amount);
    });

    const data = expenseCategories
      .filter((c) => budgetMap[c.id] > 0)
      .map((c) => {
        const budgeted = budgetMap[c.id] ?? 0;
        const spent = spentMap[c.id] ?? 0;
        const excess = Math.max(0, spent - budgeted);
        const remaining = Math.max(0, budgeted - spent);
        const usage = budgeted > 0 ? spent / budgeted : 0;
        return { cat: c, budgeted, spent, remaining, excess, usage };
      });

    data.sort((a, b) => {
      let diff = 0;
      if (sortKey === "usage") diff = a.usage - b.usage;
      else if (sortKey === "remaining") diff = a.remaining - b.remaining;
      else if (sortKey === "spent") diff = a.spent - b.spent;
      else diff = a.budgeted - b.budgeted;
      return sortDir === "desc" ? -diff : diff;
    });

    return data;
  }, [expenseCategories, monthBudgets, spentMap, sortKey, sortDir]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Presupuestos por categoría</h2>
      </div>

      {/* Divisor sutil */}
      <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center gap-1">
          <div className="text-xs text-muted-foreground">Ordenar por:</div>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-7 rounded-md border border-white/10 bg-zinc-900 text-foreground px-2 text-xs focus-visible:outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k} className="bg-zinc-900 text-foreground">
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            title={sortDir === "desc" ? "Descendente" : "Ascendente"}
          >
            <ArrowUpDown
              className={`h-3.5 w-3.5 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(({ cat, budgeted, spent, remaining, excess, usage }) => {
          const pct = Math.min(usage * 100, 100);
          const over = usage > 1;
          const barColor =
            over || usage >= 0.9
              ? "#ef4444"
              : usage >= 0.8
                ? "#f59e0b"
                : "#264B64";

          return (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1">
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </span>
                {over ? (
                  <span
                    className="tabular-nums text-red-400"
                    style={{ fontFamily: DATA_LABEL_FONT }}
                  >
                    (−${fmt(excess)}) excedido
                  </span>
                ) : (
                  <span
                    className="tabular-nums text-muted-foreground"
                    style={{ fontFamily: DATA_LABEL_FONT }}
                  >
                    +${fmt(remaining)} restante
                  </span>
                )}
              </div>
              <div className="relative h-7 w-full rounded-md bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
                {/* Data-label interno: gastado / presupuestado */}
                <span
                  className="absolute inset-y-0 left-2.5 flex items-center text-[11px] tabular-nums leading-none pointer-events-none text-white"
                  style={{ fontFamily: DATA_LABEL_FONT }}
                >
                  ${fmt(spent)} / ${fmt(budgeted)}
                </span>
                {/* % derecho */}
                <span
                  className="absolute inset-y-0 right-2.5 flex items-center text-[11px] tabular-nums text-white/50 leading-none pointer-events-none"
                  style={{ fontFamily: DATA_LABEL_FONT }}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
