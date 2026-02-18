"use client";

import { Account } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Landmark } from "lucide-react";
import { useState } from "react";
import { AccountForm } from "./account-form";

export function AccountList({ accounts }: { accounts: Account[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const debit = accounts.filter((a) => a.type === "debit" && a.is_active);
  const credit = accounts.filter((a) => a.type === "credit" && a.is_active);
  const inactive = accounts.filter((a) => !a.is_active);

  return (
    <div className="space-y-6">
      <Button onClick={() => { setEditing(null); setShowForm(true); }} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Nueva cuenta
      </Button>

      {showForm && (
        <AccountForm
          account={editing}
          onClose={() => setShowForm(false)}
        />
      )}

      {debit.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Landmark className="h-4 w-4" /> Débito
          </h2>
          <div className="space-y-2">
            {debit.map((a) => (
              <AccountCard key={a.id} account={a} onEdit={(a) => { setEditing(a); setShowForm(true); }} />
            ))}
          </div>
        </div>
      )}

      {credit.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <CreditCard className="h-4 w-4" /> Crédito
          </h2>
          <div className="space-y-2">
            {credit.map((a) => (
              <AccountCard key={a.id} account={a} onEdit={(a) => { setEditing(a); setShowForm(true); }} />
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Inactivas</h2>
          <div className="space-y-2 opacity-60">
            {inactive.map((a) => (
              <AccountCard key={a.id} account={a} onEdit={(a) => { setEditing(a); setShowForm(true); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, onEdit }: { account: Account; onEdit: (a: Account) => void }) {
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onEdit(account)}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: account.color || "#888" }}
          />
          <div>
            <p className="font-medium text-sm">{account.name}</p>
            {account.account_number && (
              <p className="text-xs text-muted-foreground">****{account.account_number}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="text-xs">
            {account.type === "credit" ? "Crédito" : "Débito"}
          </Badge>
          {account.credit_limit && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Límite: ${account.credit_limit.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
