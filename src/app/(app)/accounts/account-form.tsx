"use client";

import { Account } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function AccountForm({ account, onClose }: { account: Account | null; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<"credit" | "debit">(account?.type ?? "debit");
  const [accountNumber, setAccountNumber] = useState(account?.account_number ?? "");
  const [creditLimit, setCreditLimit] = useState(account?.credit_limit?.toString() ?? "");
  const [cutOffDay, setCutOffDay] = useState(account?.cut_off_day?.toString() ?? "");
  const [paymentDueDay, setPaymentDueDay] = useState(account?.payment_due_day?.toString() ?? "");
  const [color, setColor] = useState(account?.color ?? COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user!.id,
      name,
      type,
      account_number: accountNumber || null,
      credit_limit: type === "credit" && creditLimit ? parseFloat(creditLimit) : null,
      cut_off_day: type === "credit" && cutOffDay ? parseInt(cutOffDay) : null,
      payment_due_day: type === "credit" && paymentDueDay ? parseInt(paymentDueDay) : null,
      color,
    };

    const { error } = account
      ? await supabase.from("accounts").update(payload).eq("id", account.id)
      : await supabase.from("accounts").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(account ? "Cuenta actualizada" : "Cuenta creada");
      onClose();
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive() {
    if (!account) return;
    const supabase = createClient();
    await supabase.from("accounts").update({ is_active: !account.is_active }).eq("id", account.id);
    toast.success(account.is_active ? "Cuenta desactivada" : "Cuenta activada");
    onClose();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{account ? "Editar cuenta" : "Nueva cuenta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="BBVA Nómina" required />
          </div>

          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "credit" | "debit")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Últimos 4 dígitos</Label>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} maxLength={4} placeholder="1234" />
          </div>

          {type === "credit" && (
            <>
              <div className="space-y-1">
                <Label>Límite de crédito</Label>
                <Input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="50000" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Día de corte</Label>
                  <Input type="number" min={1} max={31} value={cutOffDay} onChange={(e) => setCutOffDay(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Día de pago</Label>
                  <Input type="number" min={1} max={31} value={paymentDueDay} onChange={(e) => setPaymentDueDay(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            {account && (
              <Button type="button" variant="ghost" onClick={toggleActive} className="text-xs">
                {account.is_active ? "Desactivar" : "Activar"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
