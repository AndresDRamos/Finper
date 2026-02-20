"use client";

import { Transaction, Account, Category, FixedExpense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthPicker } from "@/components/month-picker";
import { LayoutList, TableIcon, Plus } from "lucide-react";
import { useState } from "react";
import { TransactionForm } from "./transaction-form";
import { FixedExpenseForm } from "./fixed-expense-form";

export function TransactionsList({
  transactions,
  accounts,
  categories,
  fixedExpenses,
  currentMonth,
  initialTab = "expenses",
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  fixedExpenses: FixedExpense[];
  currentMonth: string;
  initialTab?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showFixedForm, setShowFixedForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  function openNew(type: "expense" | "income") {
    setEditing(null);
    setFormType(type);
    setShowForm(true);
    setShowFixedForm(false);
  }

  function openNewFixed() {
    setEditingFixed(null);
    setShowFixedForm(true);
    setShowForm(false);
  }

  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalFixed = fixedExpenses.reduce((s, f) => s + Number(f.amount), 0);
  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <MonthPicker currentMonth={currentMonth} allowAll />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode((v) => (v === "cards" ? "table" : "cards"))}
          title={viewMode === "cards" ? "Vista tabla" : "Vista tarjetas"}
        >
          {viewMode === "cards" ? <TableIcon className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
        </Button>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editing}
          accounts={accounts}
          categories={categories}
          defaultType={formType}
          onClose={() => setShowForm(false)}
        />
      )}

      {showFixedForm && (
        <FixedExpenseForm
          fixedExpense={editingFixed}
          accounts={accounts}
          categories={categories}
          onClose={() => setShowFixedForm(false)}
        />
      )}

      <Tabs defaultValue={initialTab}>
        <TabsList className="w-full">
          <TabsTrigger value="expenses" className="flex-1">Gastos</TabsTrigger>
          <TabsTrigger value="fixed" className="flex-1">Fijos</TabsTrigger>
          <TabsTrigger value="income" className="flex-1">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-3 mt-3">
          <Button onClick={() => openNew("expense")} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nuevo gasto
          </Button>
          <p className="text-sm text-muted-foreground">
            Total: <span className="text-foreground font-semibold">${totalExpenses.toLocaleString()}</span>
          </p>
          {viewMode === "table" ? (
            <TransactionTable transactions={expenses} onEdit={(t) => { setEditing(t); setFormType("expense"); setShowForm(true); setShowFixedForm(false); }} />
          ) : (
            expenses.map((t) => (
              <TransactionCard key={t.id} transaction={t} onClick={() => { setEditing(t); setFormType("expense"); setShowForm(true); setShowFixedForm(false); }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="fixed" className="space-y-3 mt-3">
          <Button onClick={openNewFixed} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nuevo gasto fijo
          </Button>
          <p className="text-sm text-muted-foreground">
            Total fijos: <span className="text-foreground font-semibold">${totalFixed.toLocaleString()}</span>
          </p>
          {viewMode === "table" ? (
            <FixedExpenseTable expenses={fixedExpenses} onEdit={(f) => { setEditingFixed(f); setShowFixedForm(true); setShowForm(false); }} />
          ) : (
            fixedExpenses.map((f) => (
              <FixedExpenseCard key={f.id} expense={f} onClick={() => { setEditingFixed(f); setShowFixedForm(true); setShowForm(false); }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-3 mt-3">
          <Button onClick={() => openNew("income")} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nuevo ingreso
          </Button>
          <p className="text-sm text-muted-foreground">
            Total: <span className="text-foreground font-semibold">${totalIncome.toLocaleString()}</span>
          </p>
          {viewMode === "table" ? (
            <TransactionTable transactions={income} onEdit={(t) => { setEditing(t); setFormType("income"); setShowForm(true); setShowFixedForm(false); }} />
          ) : (
            income.map((t) => (
              <TransactionCard key={t.id} transaction={t} onClick={() => { setEditing(t); setFormType("income"); setShowForm(true); setShowFixedForm(false); }} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransactionCard({ transaction: t, onClick }: { transaction: Transaction; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{t.category?.icon || (t.type === "income" ? "💰" : "📁")}</span>
          <div>
            <p className="text-sm font-medium">{t.description || t.category?.name || "Sin descripción"}</p>
            <p className="text-xs text-muted-foreground">
              {t.account?.name} · {t.transaction_date}
            </p>
          </div>
        </div>
        <p className={`text-sm font-semibold ${t.type === "income" ? "text-green-500" : ""}`}>
          {t.type === "income" ? "+" : "-"}${Number(t.amount).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function TransactionTable({ transactions, onEdit }: { transactions: Transaction[]; onEdit: (t: Transaction) => void }) {
  if (transactions.length === 0) return <p className="text-sm text-muted-foreground">Sin registros</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Fecha</th>
            <th className="text-left px-3 py-2 font-medium">Descripción</th>
            <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Cuenta</th>
            <th className="text-right px-3 py-2 font-medium">Monto</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onEdit(t)}
            >
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{t.transaction_date}</td>
              <td className="px-3 py-2">
                <span>{t.category?.icon} </span>
                {t.description || t.category?.name || "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{t.account?.name}</td>
              <td className={`px-3 py-2 text-right font-semibold ${t.type === "income" ? "text-green-500" : ""}`}>
                {t.type === "income" ? "+" : "-"}${Number(t.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FixedExpenseCard({ expense: f, onClick }: { expense: FixedExpense; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{f.category?.icon || "📦"}</span>
          <div>
            <p className="text-sm font-medium">{f.description}</p>
            <p className="text-xs text-muted-foreground">
              {f.account?.name} · desde {f.start_date}{f.end_date ? ` hasta ${f.end_date}` : ""}
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold">-${Number(f.amount).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function FixedExpenseTable({ expenses, onEdit }: { expenses: FixedExpense[]; onEdit: (f: FixedExpense) => void }) {
  if (expenses.length === 0) return <p className="text-sm text-muted-foreground">Sin gastos fijos</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Descripción</th>
            <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Inicio</th>
            <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Fin</th>
            <th className="text-right px-3 py-2 font-medium">Monto</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((f) => (
            <tr
              key={f.id}
              className="border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onEdit(f)}
            >
              <td className="px-3 py-2">
                <span>{f.category?.icon || "📦"} </span>{f.description}
              </td>
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{f.start_date}</td>
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{f.end_date || "Indefinido"}</td>
              <td className="px-3 py-2 text-right font-semibold">-${Number(f.amount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
