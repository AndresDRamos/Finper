import { createClient } from "@/lib/supabase/server";
import { Budget } from "@/lib/types";
import { BudgetConfig } from "./budget-config";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();

  const now = new Date();
  const currentYM = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = currentYM.split("-").map(Number);
  const monthStart = `${currentYM}-01`;
  const monthEnd = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

  const [
    { data: expenseCategories },
    { data: incomeCategories },
    { data: settings },
    { data: allBudgets },
    { data: allIncome },
    { data: fixedExpenses },
    { data: txns },
    { data: savingsCategory },
  ] = await Promise.all([
    supabase.from("categories").select("*").eq("type", "expense").eq("is_active", true).order("name"),
    supabase.from("categories").select("*").eq("type", "income").eq("is_active", true).order("name"),
    supabase.from("user_settings").select("*").single(),
    supabase.from("budgets").select("*").eq("month_year", currentYM),
    supabase.from("transactions").select("amount, transaction_date").eq("type", "income"),
    supabase
      .from("fixed_expenses")
      .select("amount")
      .lte("start_date", monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd),
    supabase.from("categories").select("id").eq("type", "savings").single(),
  ]);

  // Separar budget de ahorro de los budgets de categorías
  const savingsCategoryId = savingsCategory?.id ?? null;
  const monthBudgets = (allBudgets ?? []).filter((b) => b.category_id !== savingsCategoryId);
  const initialSavingsBudget = savingsCategoryId
    ? (allBudgets ?? []).find((b) => b.category_id === savingsCategoryId) ?? null
    : null;

  // Avg income
  const incomeMonths = new Set<string>();
  (allIncome ?? []).forEach((i) => incomeMonths.add(i.transaction_date.slice(0, 7)));
  const totalIncome = (allIncome ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const avgIncome = incomeMonths.size > 0 ? totalIncome / incomeMonths.size : 0;

  // Fixed expenses total for selected month
  const fixedTotal = (fixedExpenses ?? []).reduce((s, f) => s + Number(f.amount), 0);

  // Spent per category
  const spentMap: Record<string, number> = {};
  (txns ?? []).forEach((t) => {
    if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
  });

  const isNewMonth = !monthBudgets || monthBudgets.length === 0;
  let initialBudgets: Budget[] = monthBudgets ?? [];
  let referenceMonth: string | null = null;

  // If no budgets for this month, find and copy the most recent month that has budgets
  if (isNewMonth) {
    const { data: latestBudgets } = await supabase
      .from("budgets")
      .select("*")
      .neq("month_year", currentYM)
      .order("month_year", { ascending: false })
      .limit(50);

    if (latestBudgets && latestBudgets.length > 0) {
      referenceMonth = latestBudgets[0].month_year;
      initialBudgets = latestBudgets
        .filter((b) => b.month_year === referenceMonth && b.category_id !== savingsCategoryId)
        .map((b) => ({ ...b, id: undefined as unknown as string, month_year: currentYM }));
    }
  }

  return (
    <BudgetConfig
      expenseCategories={expenseCategories ?? []}
      incomeCategories={incomeCategories ?? []}
      settings={settings}
      initialBudgets={initialBudgets}
      spentMap={spentMap}
      avgIncome={avgIncome}
      fixedTotal={fixedTotal}
      currentMonth={currentYM}
      isNewMonth={isNewMonth}
      referenceMonth={referenceMonth}
      savingsCategoryId={savingsCategoryId}
      initialSavingsBudget={initialSavingsBudget}
    />
  );
}
