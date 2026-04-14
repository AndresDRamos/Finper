"use client";

import { Transaction, Account, Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicIcon } from "@/components/dynamic-icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function TransactionForm({
  transaction,
  accounts,
  categories,
  defaultType,
  onClose,
}: {
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  defaultType: "expense" | "income";
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type] = useState(transaction?.type ?? defaultType);
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [accountId, setAccountId] = useState(transaction?.account_id ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [date, setDate] = useState(
    transaction?.transaction_date ?? new Date().toISOString().split("T")[0]
  );

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "income" : c.type === "expense"
  );

  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "income" && !categoryId) {
      toast.error("Selecciona una categoría para el ingreso");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user!.id,
      type,
      amount: parseFloat(amount),
      description: description || null,
      account_id: accountId,
      category_id: categoryId || null,
      transaction_date: date,
    };

    const { error } = transaction
      ? await supabase
          .from("transactions")
          .update(payload)
          .eq("id", transaction.id)
      : await supabase.from("transactions").insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(transaction ? "Actualizado" : "Registrado");
      onClose();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!transaction || !confirm("¿Eliminar esta transacción?")) return;
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", transaction.id);
    toast.success("Eliminado");
    onClose();
    router.refresh();
  }

  const iconColor = selectedCategory?.color ?? null;
  const iconBg = iconColor ? `${iconColor}1a` : undefined;

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-0 pb-0"
      >
        {/* Handle */}
        <div className="flex justify-center pt-1 pb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        <SheetHeader className="px-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            {/* Category icon badge */}
            <span
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 transition-colors"
              style={iconBg ? { backgroundColor: iconBg } : undefined}
            >
              <DynamicIcon
                name={selectedCategory?.icon ?? null}
                className="h-5 w-5"
                style={iconColor ? { color: iconColor } : undefined}
                fallback={
                  <span className="text-muted-foreground/50 text-sm">
                    {type === "income" ? "↑" : "↓"}
                  </span>
                }
              />
            </span>

            <SheetTitle className="text-left font-semibold">
              {transaction ? "Editar" : "Nuevo"}{" "}
              {type === "income" ? "ingreso" : "gasto"}
            </SheetTitle>

            {/* Delete */}
            {transaction && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-5 pt-5 pb-10 space-y-5">
          {/* Amount — prominent */}
          <div className="flex items-baseline justify-center gap-1 py-4 border-b border-border/40">
            <span className="text-2xl text-muted-foreground/50 font-mono">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
              className="w-full text-3xl font-semibold font-mono tabular-nums text-center bg-transparent border-none outline-none placeholder:text-muted-foreground/25 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Categoría{type === "income" ? " *" : ""}
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <DynamicIcon
                        name={c.icon}
                        className="h-4 w-4 shrink-0"
                        style={c.color ? { color: c.color } : undefined}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Cuenta
            </Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Descripción
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="bg-muted/20 border-border/50"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Fecha
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-muted/20 border-border/50"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
