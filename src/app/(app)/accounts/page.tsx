import { createClient } from "@/lib/supabase/server";
import { Account } from "@/lib/types";
import { AccountList } from "./account-list";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .order("type")
    .order("name") as { data: Account[] | null };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Cuentas</h1>
      <AccountList accounts={accounts ?? []} />
    </div>
  );
}
