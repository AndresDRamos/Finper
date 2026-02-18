import { createClient } from "@/lib/supabase/server";
import { TransactionsList } from "./transactions-list";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();

  const now = new Date();
  const currentYM = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isAll = currentYM === "all";

  let txnQuery = supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  let fixedQuery = supabase
    .from("fixed_expenses")
    .select("*, account:accounts(*), category:categories(*)")
    .order("start_date", { ascending: false });

  if (!isAll) {
    const [y, m] = currentYM.split("-").map(Number);
    const monthStart = `${currentYM}-01`;
    const monthEnd = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;
    txnQuery = txnQuery.gte("transaction_date", monthStart).lte("transaction_date", monthEnd);
    fixedQuery = fixedQuery
      .lte("start_date", monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`);
  }

  const [{ data: transactions }, { data: accounts }, { data: categories }, { data: fixedExpenses }] =
    await Promise.all([
      txnQuery,
      supabase.from("accounts").select("*").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").eq("is_active", true).order("name"),
      fixedQuery,
    ]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Movimientos</h1>
      <TransactionsList
        transactions={transactions ?? []}
        accounts={accounts ?? []}
        categories={categories ?? []}
        fixedExpenses={fixedExpenses ?? []}
        currentMonth={currentYM}
      />
    </div>
  );
}
