"use client";

import { Category, Budget, UserSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MonthPicker } from "@/components/month-picker";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InputMode = "percentage" | "absolute";

interface CategoryBudgetState {
  id?: string;
  inputMode: InputMode;
  inputValue: string;
  isManual: boolean;
  spentAmount: number;
}

export function BudgetConfig({
  categories,
  settings,
  initialBudgets,
  spentMap,
  avgIncome,
  fixedTotal,
  currentMonth,
  isNewMonth,
  referenceMonth,
}: {
  categories: Category[];
  settings: UserSettings | null;
  initialBudgets: Budget[];       // budgets for selected month (may be empty)
  spentMap: Record<string, number>;
  avgIncome: number;
  fixedTotal: number;
  currentMonth: string;           // "YYYY-MM"
  isNewMonth: boolean;            // true if no budgets exist for selected month
  referenceMonth: string | null;  // last month that had budgets
}) {
  // Savings state
  const initSavingsMode = (settings?.savings_type ?? "percentage") as InputMode;
  const initSavingsValue =
    initSavingsMode === "absolute" && settings?.savings_amount
      ? settings.savings_amount.toString()
      : (settings?.savings_percentage ?? 20).toString();

  const [savingsMode, setSavingsMode] = useState<InputMode>(initSavingsMode);
  const [savingsValue, setSavingsValue] = useState(initSavingsValue);
  const [loading, setLoading] = useState(false);

  // Build initial category state from initialBudgets
  const buildInitialCatBudgets = () => {
    const bdMap = new Map(initialBudgets.map((b) => [b.category_id, b]));
    const map = new Map<string, CategoryBudgetState>();
    for (const cat of categories) {
      const bd = bdMap.get(cat.id);
      map.set(cat.id, {
        id: bd?.id,
        inputMode: (bd?.input_type as InputMode) ?? "absolute",
        inputValue: bd?.is_manual ? (bd.input_value?.toString() ?? "") : "",
        isManual: bd?.is_manual ?? false,
        spentAmount: spentMap[cat.id] ?? 0,
      });
    }
    return map;
  };

  const [catBudgets, setCatBudgets] = useState<Map<string, CategoryBudgetState>>(buildInitialCatBudgets);

  // Computed values
  const savingsAmount = useMemo(() => {
    const v = parseFloat(savingsValue) || 0;
    return savingsMode === "percentage" ? avgIncome * (v / 100) : v;
  }, [savingsMode, savingsValue, avgIncome]);

  const netIncome = avgIncome - fixedTotal - savingsAmount;

  const resolvedAmounts = useMemo(() => {
    const result = new Map<string, number>();
    let manualTotal = 0;
    let autoCount = 0;

    for (const [catId, state] of catBudgets) {
      if (state.isManual && state.inputValue !== "") {
        const v = parseFloat(state.inputValue) || 0;
        const amount = state.inputMode === "percentage" ? netIncome * (v / 100) : v;
        result.set(catId, amount);
        manualTotal += amount;
      } else {
        autoCount++;
        result.set(catId, 0);
      }
    }

    const remaining = netIncome - manualTotal;
    const autoAmount = autoCount > 0 ? Math.max(0, remaining / autoCount) : 0;

    for (const [catId, state] of catBudgets) {
      if (!state.isManual || state.inputValue === "") {
        result.set(catId, autoAmount);
      }
    }

    return result;
  }, [catBudgets, netIncome]);

  const totalAllocated = useMemo(
    () => Array.from(resolvedAmounts.values()).reduce((s, v) => s + v, 0),
    [resolvedAmounts]
  );

  const totalSpent = useMemo(
    () => Array.from(catBudgets.values()).reduce((s, b) => s + b.spentAmount, 0),
    [catBudgets]
  );

  const isOverBudget = totalAllocated > netIncome + 0.01;

  function updateCatBudget(catId: string, changes: Partial<CategoryBudgetState>) {
    setCatBudgets((prev) => {
      const next = new Map(prev);
      next.set(catId, { ...next.get(catId)!, ...changes });
      return next;
    });
  }

  function resetCategory(catId: string) {
    updateCatBudget(catId, { isManual: false, inputValue: "" });
  }

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Save savings settings
    const savingsPct =
      savingsMode === "percentage"
        ? parseFloat(savingsValue) || 20
        : (settings?.savings_percentage ?? 20);

    await supabase.from("user_settings").update({
      savings_percentage: savingsPct,
      savings_type: savingsMode,
      savings_amount: savingsMode === "absolute" ? parseFloat(savingsValue) || null : null,
    }).eq("user_id", user!.id);

    // Save budgets
    const updatedMap = new Map(catBudgets);
    for (const [categoryId, state] of catBudgets) {
      const computedAmount = resolvedAmounts.get(categoryId) ?? 0;
      const inputVal = parseFloat(state.inputValue) || null;

      const payload = {
        user_id: user!.id,
        category_id: categoryId,
        month_year: currentMonth,
        amount: computedAmount,
        input_type: state.inputMode,
        input_value: state.isManual ? inputVal : null,
        is_manual: state.isManual,
      };

      if (state.id) {
        await supabase.from("budgets").update(payload).eq("id", state.id);
      } else {
        const { data: inserted } = await supabase
          .from("budgets")
          .insert(payload)
          .select("id")
          .single();
        if (inserted) {
          const cur = updatedMap.get(categoryId)!;
          updatedMap.set(categoryId, { ...cur, id: inserted.id });
        }
      }
    }

    setCatBudgets(updatedMap);
    toast.success("Presupuesto guardado");
    setLoading(false);
  }

  const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  function fmtMonth(ym: string) {
    const [y, m] = ym.split("-");
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold">Presupuesto</h1>
      <MonthPicker currentMonth={currentMonth} />

      {/* New month banner */}
      {isNewMonth && referenceMonth && (
        <div className="flex items-start gap-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md px-3 py-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Presupuesto nuevo basado en <strong>{fmtMonth(referenceMonth)}</strong>. Ajusta los valores y guarda.
          </span>
        </div>
      )}

      {/* Net income summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ingreso neto disponible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ingreso promedio</span>
            <span>${avgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gastos fijos</span>
            <span>-${fixedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ahorro</span>
            <span>-${savingsAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>Neto</span>
            <span className={netIncome < 0 ? "text-red-500" : "text-green-500"}>
              ${netIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Savings config */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Ahorro mensual</p>
            <ModeToggle mode={savingsMode} onChange={setSavingsMode} />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step={savingsMode === "percentage" ? "0.5" : "1"}
              min="0"
              max={savingsMode === "percentage" ? "100" : undefined}
              value={savingsValue}
              onChange={(e) => setSavingsValue(e.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground w-24 shrink-0">
              {savingsMode === "percentage"
                ? `= $${savingsAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : `(${avgIncome > 0 ? ((savingsAmount / avgIncome) * 100).toFixed(1) : 0}%)`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Over budget warning */}
      {isOverBudget && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Excedes el ingreso neto por ${(totalAllocated - netIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}. Ajusta los montos.
          </span>
        </div>
      )}

      {/* Category budgets */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <p className="text-sm font-medium">Categorías de gasto</p>
          <p className="text-xs text-muted-foreground">
            Asignado: ${totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            {" · "}Gastado: ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        {categories.map((cat) => {
          const state = catBudgets.get(cat.id);
          if (!state) return null;
          const budgetAmt = resolvedAmounts.get(cat.id) ?? 0;
          const spentAmt = state.spentAmount;
          const pct = budgetAmt > 0 ? (spentAmt / budgetAmt) * 100 : 0;

          return (
            <Card key={cat.id}>
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm flex items-center gap-1.5">
                    {cat.icon} {cat.name}
                    {!state.isManual && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Auto</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ${spentAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${budgetAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder={
                      state.isManual
                        ? ""
                        : `${budgetAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} (auto)`
                    }
                    value={state.inputValue}
                    onChange={(e) =>
                      updateCatBudget(cat.id, {
                        inputValue: e.target.value,
                        isManual: e.target.value !== "",
                      })
                    }
                    className="h-8 text-sm"
                  />
                  <ModeToggle
                    mode={state.inputMode}
                    onChange={(m) => updateCatBudget(cat.id, { inputMode: m })}
                  />
                  {state.isManual && (
                    <button
                      type="button"
                      onClick={() => resetCategory(cat.id)}
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                      title="Quitar manual"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {state.inputMode === "percentage" && state.isManual && state.inputValue && (
                  <p className="text-xs text-muted-foreground">
                    = ${(netIncome * ((parseFloat(state.inputValue) || 0) / 100)).toLocaleString(
                      undefined, { maximumFractionDigits: 0 }
                    )}
                  </p>
                )}

                {budgetAmt > 0 && (
                  <Progress
                    value={Math.min(pct, 100)}
                    className={pct > 100 ? "[&>div]:bg-red-500" : pct > 80 ? "[&>div]:bg-yellow-500" : ""}
                  />
                )}
                {pct > 100 && (
                  <p className="text-xs text-red-500">
                    Excedido por ${(spentAmt - budgetAmt).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleSave} className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Guardar presupuesto"}
      </Button>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: InputMode; onChange: (m: InputMode) => void }) {
  return (
    <div className="flex rounded-md overflow-hidden border text-xs shrink-0">
      <button
        type="button"
        className={`px-2 py-1 transition-colors ${mode === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => onChange("percentage")}
      >
        %
      </button>
      <button
        type="button"
        className={`px-2 py-1 transition-colors ${mode === "absolute" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => onChange("absolute")}
      >
        $
      </button>
    </div>
  );
}
