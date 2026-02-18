"use client";

import { Transaction, Category, Budget, UserSettings, FixedExpense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MonthPicker } from "@/components/month-picker";
import { useMemo } from "react";

function getMonthsSet(income: { amount: number; transaction_date: string }[]) {
  const months = new Set<string>();
  income.forEach((i) => months.add(i.transaction_date.slice(0, 7)));
  return months;
}

export function Dashboard({
  settings,
  transactions,
  allIncome,
  categories,
  budgets,
  fixedExpenses,
  currentMonth,
}: {
  settings: UserSettings | null;
  transactions: Transaction[];
  allIncome: { amount: number; transaction_date: string }[];
  categories: Category[];
  budgets: Budget[];
  fixedExpenses: FixedExpense[];
  currentMonth: string;
}) {
  const savingsPct = settings?.savings_percentage ?? 20;

  const avgIncome = useMemo(() => {
    const months = getMonthsSet(allIncome);
    if (months.size === 0) return 0;
    const total = allIncome.reduce((s, i) => s + Number(i.amount), 0);
    return total / months.size;
  }, [allIncome]);

  const fixedTotal = useMemo(
    () => fixedExpenses.reduce((s, f) => s + Number(f.amount), 0),
    [fixedExpenses]
  );

  const savingsAmount = avgIncome * (savingsPct / 100);
  const available = avgIncome - fixedTotal - savingsAmount;

  const variableExpenses = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );

  const remaining = available - variableExpenses;

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { category: Category; total: number }>();
    transactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        const cat = t.category!;
        const entry = map.get(cat.id) || { category: cat, total: 0 };
        entry.total += Number(t.amount);
        map.set(cat.id, entry);
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const budgetMap = useMemo(() => {
    const map = new Map<string, number>();
    budgets.forEach((b) => map.set(b.category_id, Number(b.amount)));
    return map;
  }, [budgets]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <MonthPicker currentMonth={currentMonth} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard label="Ingreso promedio" value={avgIncome} />
        <SummaryCard label="Gastos fijos" value={fixedTotal} />
        <SummaryCard label={`Ahorro (${savingsPct}%)`} value={savingsAmount} />
        <SummaryCard label="Disponible" value={available} />
      </div>

      {/* Spending gauge */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Gastado</span>
            <span className={remaining < 0 ? "text-red-500 font-semibold" : ""}>
              ${variableExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${available.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <Progress value={available > 0 ? Math.min((variableExpenses / available) * 100, 100) : 0} />
          <p className={`text-xs mt-1 ${remaining < 0 ? "text-red-500" : "text-muted-foreground"}`}>
            {remaining >= 0
              ? `Te quedan $${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : `Excedido por $${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </p>
        </CardContent>
      </Card>

      {/* Fixed expenses breakdown */}
      {fixedExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos fijos del mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fixedExpenses.map((f) => (
              <div key={f.id} className="flex justify-between text-sm">
                <span>{f.category?.icon || "📦"} {f.description}</span>
                <span className="font-medium">${Number(f.amount).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expensesByCategory.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin gastos este mes</p>
          )}
          {expensesByCategory.map(({ category, total }) => {
            const budget = budgetMap.get(category.id);
            const pct = budget ? (total / budget) * 100 : 0;
            return (
              <div key={category.id}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span>
                    {category.icon} {category.name}
                  </span>
                  <span>
                    ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    {budget ? ` / $${budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ""}
                  </span>
                </div>
                {budget ? (
                  <Progress
                    value={Math.min(pct, 100)}
                    className={pct > 100 ? "[&>div]:bg-red-500" : pct > 80 ? "[&>div]:bg-yellow-500" : ""}
                  />
                ) : (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: category.color || "#888",
                        width: `${expensesByCategory.length > 0 ? (total / expensesByCategory[0].total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-3 px-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
      </CardContent>
    </Card>
  );
}
