"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Account, Category } from "@/lib/types";
import { NewTransactionModal } from "@/components/new-transaction-modal";

export function NewTransactionFab({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>

      <NewTransactionModal
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
