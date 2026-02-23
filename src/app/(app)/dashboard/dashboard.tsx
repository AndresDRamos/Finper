"use client";

import {
  Transaction,
  UserSettings,
  FixedExpense,
  Budget,
  Category,
  Account,
} from "@/lib/types";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { IncomeRing } from "./income-ring";
import { BudgetBars } from "./budget-bars";
import { NewTransactionFab } from "@/components/new-transaction-fab";

function getMonthsSet(income: { amount: number; transaction_date: string }[]) {
  const months = new Set<string>();
  income.forEach((i) => months.add(i.transaction_date.slice(0, 7)));
  return months;
}

export function Dashboard({
  settings,
  transactions,
  recentIncome,
  fixedExpenses,
  savingsBudget,
  savingsCategoryId: _savingsCategoryId,
  currentMonth: _currentMonth,
  expenseCategories,
  monthBudgets,
  spentMap,
  accounts,
  allCategories,
}: {
  settings: UserSettings | null;
  transactions: Transaction[];
  recentIncome: { amount: number; transaction_date: string }[];
  fixedExpenses: FixedExpense[];
  savingsBudget: Budget | null;
  savingsCategoryId: string | null;
  currentMonth: string;
  expenseCategories: Category[];
  monthBudgets: Budget[];
  spentMap: Record<string, number>;
  accounts: Account[];
  allCategories: Category[];
}) {
  const router = useRouter();
  const [manualInput, setManualInput] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const avgIncome = useMemo(() => {
    const months = getMonthsSet(recentIncome);
    if (months.size === 0) return null;
    const total = recentIncome.reduce((s, i) => s + Number(i.amount), 0);
    return total / months.size;
  }, [recentIncome]);

  const effectiveIncome = avgIncome ?? settings?.manual_income_estimate ?? 0;
  const hasNoIncome = avgIncome === null && !settings?.manual_income_estimate;

  const fixedTotal = useMemo(
    () => fixedExpenses.reduce((s, f) => s + Number(f.amount), 0),
    [fixedExpenses],
  );
  const savingsAmount = useMemo(
    () => (savingsBudget ? Number(savingsBudget.amount) : 0),
    [savingsBudget],
  );
  const variableExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0),
    [transactions],
  );
  const remaining = Math.max(
    0,
    effectiveIncome - fixedTotal - savingsAmount - variableExpenses,
  );

  const pieSegments = [
    { name: "Ahorro", value: savingsAmount, color: "#A02B93", href: "/budget" },
    {
      name: "Fijos",
      value: fixedTotal,
      color: "#156082",
      href: "/transactions?tab=fixed",
    },
    {
      name: "Gastos",
      value: variableExpenses,
      color: "#E97132",
      href: "/transactions?tab=expenses",
    },
    { name: "Presupuesto", value: remaining, color: "#555", href: "/budget" },
  ].filter((d) => d.value > 0);

  async function handleSaveManual() {
    if (!manualInput) return;
    setSavingManual(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("user_settings")
      .update({ manual_income_estimate: parseFloat(manualInput) })
      .eq("user_id", user!.id);
    toast.success("Ingreso estimado guardado");
    setSavingManual(false);
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Prompt de ingreso inicial */}
      {hasNoIncome && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 space-y-3">
          <p className="text-sm text-yellow-400 font-medium">
            Para comenzar, ingresa tu ingreso mensual promedio estimado
          </p>
          <p className="text-xs text-muted-foreground">
            El sistema lo irá ajustando automáticamente conforme registres tus
            ingresos.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Ej. 25000"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              onClick={handleSaveManual}
              disabled={savingManual || !manualInput}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {savingManual ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
      <IncomeRing
        segments={pieSegments}
        effectiveIncome={effectiveIncome}
        avgIncome={avgIncome}
      />

      <BudgetBars
        expenseCategories={expenseCategories}
        monthBudgets={monthBudgets}
        spentMap={spentMap}
      />

      <NewTransactionFab accounts={accounts} categories={allCategories} />
    </div>
  );
}
