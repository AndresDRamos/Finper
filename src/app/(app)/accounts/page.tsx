import { createClient } from "@/lib/supabase/server";
import { Account } from "@/lib/types";
import { AccountList } from "./account-list";
import { NewTransactionFab } from "@/components/new-transaction-fab";

export default async function AccountsPage() {
  const supabase = await createClient();
  const [accountsResult, { data: categories }] = await Promise.all([
    supabase.from("accounts").select("*").order("type").order("name"),
    supabase.from("categories").select("*").eq("is_active", true).order("name"),
  ]);
  const accounts = accountsResult.data as Account[] | null;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Cuentas</h1>
      <AccountList accounts={accounts ?? []} />
      <NewTransactionFab accounts={accounts ?? []} categories={categories ?? []} />
    </div>
  );
}
