import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "./dashboard/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = `${currentYM}-01`;
  const [y, m] = currentYM.split("-").map(Number);
  const monthEnd = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

  // Calcular rango de los últimos 3 meses anteriores al mes actual
  const prevDate = new Date(y, m - 1, 1); // primer día del mes actual
  prevDate.setMonth(prevDate.getMonth() - 3);
  const threeMonthsAgoStart = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;
  // último día del mes anterior
  const prevMonthEnd = new Date(y, m - 1, 0);
  const lastMonthEnd = `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(prevMonthEnd.getDate()).padStart(2, "0")}`;

  // Auto-seed fixed_system, income, and savings categories for existing users
  const { data: existingSpecial } = await supabase
    .from("categories")
    .select("type")
    .in("type", ["fixed_system", "income", "savings"]);

  const hasFixed = existingSpecial?.some((c) => c.type === "fixed_system");
  const hasIncome = existingSpecial?.some((c) => c.type === "income");
  const hasSavings = existingSpecial?.some((c) => c.type === "savings");

  if (!hasFixed || !hasIncome || !hasSavings) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const toInsert = [];
      if (!hasFixed) {
        toInsert.push(
          { user_id: user.id, name: "Suscripción", icon: "📦", color: "#8b5cf6", type: "fixed_system" },
          { user_id: user.id, name: "Servicio", icon: "⚡", color: "#f97316", type: "fixed_system" },
        );
      }
      if (!hasIncome) {
        toInsert.push(
          { user_id: user.id, name: "Nómina", icon: "💵", color: "#22c55e", type: "income" },
          { user_id: user.id, name: "Aguinaldo", icon: "🎁", color: "#f59e0b", type: "income" },
          { user_id: user.id, name: "Fondo de ahorro", icon: "🏦", color: "#3b82f6", type: "income" },
        );
      }
      if (!hasSavings) {
        toInsert.push(
          { user_id: user.id, name: "Ahorro", icon: "💜", color: "#A02B93", type: "savings" },
        );
      }
      if (toInsert.length > 0) await supabase.from("categories").insert(toInsert);
    }
  }

  const [
    { data: settings },
    { data: transactions },
    { data: recentIncome },
    { data: fixedExpenses },
    { data: savingsCategory },
    { data: expenseCategories },
    { data: monthBudgets },
    { data: accounts },
    { data: allCategories },
  ] = await Promise.all([
    supabase.from("user_settings").select("*").single(),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd)
      .order("transaction_date", { ascending: false }),
    // Ingresos de los últimos 3 meses (no incluye el mes actual)
    supabase
      .from("transactions")
      .select("amount, transaction_date")
      .eq("type", "income")
      .gte("transaction_date", threeMonthsAgoStart)
      .lte("transaction_date", lastMonthEnd),
    supabase
      .from("fixed_expenses")
      .select("*, account:accounts(*), category:categories(*)")
      .lte("start_date", monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`),
    supabase
      .from("categories")
      .select("id")
      .eq("type", "savings")
      .single(),
    supabase.from("categories").select("*").eq("type", "expense").eq("is_active", true).order("name"),
    supabase.from("budgets").select("*").eq("month_year", currentYM),
    supabase.from("accounts").select("*").eq("is_active", true).order("name"),
    supabase.from("categories").select("*").eq("is_active", true).order("name"),
  ]);

  // Spent per expense category this month
  const spentMap: Record<string, number> = {};
  (transactions ?? [])
    .filter((t) => t.type === "expense" && t.category_id)
    .forEach((t) => {
      spentMap[t.category_id!] = (spentMap[t.category_id!] || 0) + Number(t.amount);
    });

  // Buscar budget de ahorro del mes actual
  let savingsBudget = null;
  if (savingsCategory?.id) {
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("category_id", savingsCategory.id)
      .eq("month_year", currentYM)
      .maybeSingle();
    savingsBudget = data;
  }

  return (
    <Dashboard
      settings={settings}
      transactions={transactions ?? []}
      recentIncome={recentIncome ?? []}
      fixedExpenses={fixedExpenses ?? []}
      savingsBudget={savingsBudget}
      savingsCategoryId={savingsCategory?.id ?? null}
      currentMonth={currentYM}
      expenseCategories={expenseCategories ?? []}
      monthBudgets={monthBudgets ?? []}
      spentMap={spentMap}
      accounts={accounts ?? []}
      allCategories={allCategories ?? []}
    />
  );
}
