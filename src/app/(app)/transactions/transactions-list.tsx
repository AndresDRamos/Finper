"use client";

import { Transaction, Account, Category, FixedExpense } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthPicker } from "@/components/month-picker";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { TransactionForm } from "./transaction-form";
import { FixedExpenseForm } from "./fixed-expense-form";
import { SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category";

interface FilterState {
  categories: string[];
  accounts: string[];
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const EMPTY_FILTERS: FilterState = {
  categories: [],
  accounts: [],
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Fecha (más reciente)" },
  { value: "date-asc", label: "Fecha (más antigua)" },
  { value: "amount-desc", label: "Monto (mayor a menor)" },
  { value: "amount-asc", label: "Monto (menor a mayor)" },
  { value: "category", label: "Categoría (A–Z)" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: "symbol",
  }).format(amount);
}

function applyTransactionFilters(
  items: Transaction[],
  filters: FilterState,
  sortBy: SortOption
): Transaction[] {
  const result = items.filter((t) => {
    if (filters.categories.length > 0 && !filters.categories.includes(t.category_id ?? "")) return false;
    if (filters.accounts.length > 0 && !filters.accounts.includes(t.account_id)) return false;
    if (filters.amountMin !== "" && Number(t.amount) < parseFloat(filters.amountMin)) return false;
    if (filters.amountMax !== "" && Number(t.amount) > parseFloat(filters.amountMax)) return false;
    if (filters.dateFrom !== "" && t.transaction_date < filters.dateFrom) return false;
    if (filters.dateTo !== "" && t.transaction_date > filters.dateTo) return false;
    return true;
  });

  result.sort((a, b) => {
    switch (sortBy) {
      case "date-desc": {
        const d = b.transaction_date.localeCompare(a.transaction_date);
        return d !== 0 ? d : b.created_at.localeCompare(a.created_at);
      }
      case "date-asc": {
        const d = a.transaction_date.localeCompare(b.transaction_date);
        return d !== 0 ? d : a.created_at.localeCompare(b.created_at);
      }
      case "amount-desc": return Number(b.amount) - Number(a.amount);
      case "amount-asc": return Number(a.amount) - Number(b.amount);
      case "category": return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
    }
    return 0;
  });

  return result;
}

function applyFixedFilters(
  items: FixedExpense[],
  filters: FilterState,
  sortBy: SortOption
): FixedExpense[] {
  const result = items.filter((f) => {
    if (filters.categories.length > 0 && !filters.categories.includes(f.category_id ?? "")) return false;
    if (filters.accounts.length > 0 && !filters.accounts.includes(f.account_id)) return false;
    if (filters.amountMin !== "" && Number(f.amount) < parseFloat(filters.amountMin)) return false;
    if (filters.amountMax !== "" && Number(f.amount) > parseFloat(filters.amountMax)) return false;
    return true;
  });

  result.sort((a, b) => {
    switch (sortBy) {
      case "date-desc": return b.start_date.localeCompare(a.start_date);
      case "date-asc": return a.start_date.localeCompare(b.start_date);
      case "amount-desc": return Number(b.amount) - Number(a.amount);
      case "amount-asc": return Number(a.amount) - Number(b.amount);
      case "category": return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
    }
    return 0;
  });

  return result;
}

/* ─── Main component ──────────────────────────────────────────────────────── */

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
  const [activeTab, setActiveTab] = useState(
    initialTab === "fixed" || initialTab === "income" ? initialTab : "expenses"
  );
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  const filteredExpenses = useMemo(
    () => applyTransactionFilters(expenses, filters, sortBy),
    [expenses, filters, sortBy]
  );
  const filteredFixed = useMemo(
    () => applyFixedFilters(fixedExpenses, filters, sortBy),
    [fixedExpenses, filters, sortBy]
  );
  const filteredIncome = useMemo(
    () => applyTransactionFilters(income, filters, sortBy),
    [income, filters, sortBy]
  );

  const currentTotal = useMemo(() => {
    if (activeTab === "expenses") return filteredExpenses.reduce((s, t) => s + Number(t.amount), 0);
    if (activeTab === "fixed") return filteredFixed.reduce((s, f) => s + Number(f.amount), 0);
    return filteredIncome.reduce((s, t) => s + Number(t.amount), 0);
  }, [activeTab, filteredExpenses, filteredFixed, filteredIncome]);

  const activeFilterCount = [
    filters.categories.length > 0,
    filters.accounts.length > 0,
    filters.dateFrom !== "",
    filters.dateTo !== "",
    filters.amountMin !== "",
    filters.amountMax !== "",
  ].filter(Boolean).length;

  return (
    <>
      {/* Forms */}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 -mx-4 px-4 pb-3 pt-2 space-y-2">
          <MonthPicker currentMonth={currentMonth} allowAll />

          <TabsList className="w-full">
            <TabsTrigger value="expenses" className="flex-1">Gastos</TabsTrigger>
            <TabsTrigger value="fixed" className="flex-1">Fijos</TabsTrigger>
            <TabsTrigger value="income" className="flex-1">Ingresos</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setShowFilterSheet(true)}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filtrar
              {activeFilterCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setShowSortSheet(true)}
            >
              <ArrowUpDown className="h-3 w-3" />
              Ordenar por
              {sortBy !== "date-desc" && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
            </Button>
          </div>

          {/* ── Summary bar (sticky) ── */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs text-muted-foreground">Lista de transacciones</span>
            <span className="text-xs font-semibold tabular-nums">
              Total: {formatAmount(currentTotal)}
            </span>
          </div>
        </div>

        {/* ── Tab contents ── */}
        <TabsContent value="expenses" className="mt-0">
          <LedgerTable>
            {filteredExpenses.length === 0 ? (
              <EmptyState label="Sin gastos" />
            ) : (
              filteredExpenses.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onClick={() => {
                    setEditing(t);
                    setFormType("expense");
                    setShowForm(true);
                    setShowFixedForm(false);
                  }}
                />
              ))
            )}
          </LedgerTable>
        </TabsContent>

        <TabsContent value="fixed" className="mt-0">
          <LedgerTable>
            {filteredFixed.length === 0 ? (
              <EmptyState label="Sin gastos fijos" />
            ) : (
              filteredFixed.map((f) => (
                <FixedExpenseRow
                  key={f.id}
                  expense={f}
                  onClick={() => {
                    setEditingFixed(f);
                    setShowFixedForm(true);
                    setShowForm(false);
                  }}
                />
              ))
            )}
          </LedgerTable>
        </TabsContent>

        <TabsContent value="income" className="mt-0">
          <LedgerTable>
            {filteredIncome.length === 0 ? (
              <EmptyState label="Sin ingresos" />
            ) : (
              filteredIncome.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onClick={() => {
                    setEditing(t);
                    setFormType("income");
                    setShowForm(true);
                    setShowFixedForm(false);
                  }}
                />
              ))
            )}
          </LedgerTable>
        </TabsContent>
      </Tabs>

      {/* ── Filter Sheet ── */}
      <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Filtrar</SheetTitle>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="overflow-y-auto space-y-5 px-4 pb-4">
            {/* Categoría — dropdown */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Categoría</p>
              <Select
                value={filters.categories[0] ?? "all"}
                onValueChange={(val) =>
                  setFilters((f) => ({ ...f, categories: val === "all" ? [] : [val] }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Cuenta — dropdown */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Cuenta</p>
              <Select
                value={filters.accounts[0] ?? "all"}
                onValueChange={(val) =>
                  setFilters((f) => ({ ...f, accounts: val === "all" ? [] : [val] }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todas las cuentas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Date range */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Rango de fechas</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Amount range */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Rango de monto</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mínimo</label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={filters.amountMin}
                    onChange={(e) => setFilters((f) => ({ ...f, amountMin: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Máximo</label>
                  <Input
                    type="number"
                    placeholder="Sin límite"
                    value={filters.amountMax}
                    onChange={(e) => setFilters((f) => ({ ...f, amountMax: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Sort Sheet ── */}
      <Sheet open={showSortSheet} onOpenChange={setShowSortSheet}>
        <SheetContent side="bottom" className="max-h-[60vh]">
          <SheetHeader>
            <SheetTitle>Ordenar por</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 px-4 mt-4">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSortBy(opt.value);
                  setShowSortSheet(false);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm hover:bg-muted/30 transition-colors"
              >
                <span
                  className={cn(
                    sortBy === opt.value ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {opt.label}
                </span>
                {sortBy === opt.value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function LedgerTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground text-center py-8">{label}</p>
  );
}

function TransactionRow({
  transaction: t,
  onClick,
}: {
  transaction: Transaction;
  onClick: () => void;
}) {
  const label = t.description || t.category?.name || "—";
  const sub = t.description && t.category?.name ? t.category.name : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
    >
      <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <DynamicIcon
          name={t.category?.icon ?? null}
          className="h-4 w-4 text-foreground/70"
          fallback={<span className="text-xs">{t.type === "income" ? "↑" : "↓"}</span>}
        />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium leading-tight truncate">{label}</span>
        {sub && (
          <span className="block text-xs text-muted-foreground leading-tight mt-0.5">{sub}</span>
        )}
      </span>

      <span className="text-xs text-muted-foreground tabular-nums font-mono shrink-0 w-13 text-center">
        {formatDate(t.transaction_date)}
      </span>

      <span className="text-sm font-semibold tabular-nums font-mono shrink-0 w-22 text-right">
        {formatAmount(Number(t.amount))}
      </span>
    </button>
  );
}

function FixedExpenseRow({
  expense: f,
  onClick,
}: {
  expense: FixedExpense;
  onClick: () => void;
}) {
  const sub = f.category?.name ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
    >
      <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <DynamicIcon
          name={f.category?.icon ?? null}
          className="h-4 w-4 text-foreground/70"
          fallback={<span className="text-xs">↻</span>}
        />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium leading-tight truncate">{f.description}</span>
        {sub && (
          <span className="block text-xs text-muted-foreground leading-tight mt-0.5">{sub}</span>
        )}
      </span>

      <span className="text-xs text-muted-foreground tabular-nums font-mono shrink-0 w-13 text-center">
        {formatDate(f.start_date)}
      </span>

      <span className="text-sm font-semibold tabular-nums font-mono shrink-0 w-22 text-right">
        {formatAmount(Number(f.amount))}
      </span>
    </button>
  );
}
