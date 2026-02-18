"use client";

import { Transaction, Account, Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";

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
  const [type, setType] = useState(transaction?.type ?? defaultType);
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [accountId, setAccountId] = useState(transaction?.account_id ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [date, setDate] = useState(transaction?.transaction_date ?? new Date().toISOString().split("T")[0]);

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "income" : c.type === "expense"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "income" && !categoryId) {
      toast.error("Selecciona una categoría para el ingreso");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      ? await supabase.from("transactions").update(payload).eq("id", transaction.id)
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

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-medium text-sm">
            {transaction ? "Editar" : "Nuevo"} {type === "income" ? "ingreso" : "gasto"}
          </p>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Monto</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label>Cuenta</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Categoría{type === "income" ? " *" : ""}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>

          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>Guardar</Button>
            {transaction && (
              <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
