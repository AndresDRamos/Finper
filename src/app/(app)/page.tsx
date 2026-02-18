import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "./dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();

  const now = new Date();
  const currentYM = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = `${currentYM}-01`;
  const [y, m] = currentYM.split("-").map(Number);
  const monthEnd = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

  // Auto-seed fixed_system and income categories for existing users (once per type)
  const { data: existingSpecial } = await supabase
    .from("categories")
    .select("type")
    .in("type", ["fixed_system", "income"]);

  const hasFixed = existingSpecial?.some((c) => c.type === "fixed_system");
  const hasIncome = existingSpecial?.some((c) => c.type === "income");

  if (!hasFixed || !hasIncome) {
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
      if (toInsert.length > 0) await supabase.from("categories").insert(toInsert);
    }
  }

  const [
    { data: settings },
    { data: transactions },
    { data: allIncome },
    { data: categories },
    { data: budgets },
    { data: fixedExpenses },
  ] = await Promise.all([
    supabase.from("user_settings").select("*").single(),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount, transaction_date")
      .eq("type", "income"),
    supabase.from("categories").select("*").eq("is_active", true).order("name"),
    supabase.from("budgets").select("*, category:categories(*)").eq("month_year", currentYM),
    supabase
      .from("fixed_expenses")
      .select("*, account:accounts(*), category:categories(*)")
      .lte("start_date", monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`),
  ]);

  return (
    <Dashboard
      settings={settings}
      transactions={transactions ?? []}
      allIncome={allIncome ?? []}
      categories={categories ?? []}
      budgets={budgets ?? []}
      fixedExpenses={fixedExpenses ?? []}
      currentMonth={currentYM}
    />
  );
}
