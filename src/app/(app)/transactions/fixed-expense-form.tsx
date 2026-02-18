"use client";

import { FixedExpense, Account, Category } from "@/lib/types";
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

export function FixedExpenseForm({
  fixedExpense,
  accounts,
  categories,
  onClose,
}: {
  fixedExpense: FixedExpense | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(fixedExpense?.amount?.toString() ?? "");
  const [description, setDescription] = useState(fixedExpense?.description ?? "");
  const [accountId, setAccountId] = useState(fixedExpense?.account_id ?? "");
  const [categoryId, setCategoryId] = useState(fixedExpense?.category_id ?? "");
  const [startDate, setStartDate] = useState(fixedExpense?.start_date ?? new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(fixedExpense?.end_date ?? "");

  const fixedCategories = categories.filter((c) => c.type === "fixed_system");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user!.id,
      amount: parseFloat(amount),
      description,
      account_id: accountId,
      category_id: categoryId || null,
      start_date: startDate,
      end_date: endDate || null,
    };

    const { error } = fixedExpense
      ? await supabase.from("fixed_expenses").update(payload).eq("id", fixedExpense.id)
      : await supabase.from("fixed_expenses").insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(fixedExpense ? "Actualizado" : "Registrado");
      onClose();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!fixedExpense || !confirm("¿Eliminar este gasto fijo?")) return;
    const supabase = createClient();
    await supabase.from("fixed_expenses").delete().eq("id", fixedExpense.id);
    toast.success("Eliminado");
    onClose();
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-medium text-sm">
            {fixedExpense ? "Editar" : "Nuevo"} gasto fijo
          </p>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Netflix, Renta..." required />
          </div>

          <div className="space-y-1">
            <Label>Monto</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
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
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {fixedCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Fecha inicio</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Fecha fin</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Indefinido" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Deja fecha fin vacía si es indefinido.</p>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>Guardar</Button>
            {fixedExpense && (
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
