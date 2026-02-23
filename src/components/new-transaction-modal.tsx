"use client";

import { Account, Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Receipt, CalendarClock, TrendingUp } from "lucide-react";

type TxType = "expense" | "income" | "fixed";

export function NewTransactionModal({
  open,
  onOpenChange,
  accounts,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "form">("type");
  const [txType, setTxType] = useState<TxType>("expense");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");

  function resetForm() {
    setStep("type");
    setAmount("");
    setDescription("");
    setAccountId("");
    setCategoryId("");
    setDate(new Date().toISOString().split("T")[0]);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
  }

  function handleOpenChange(open: boolean) {
    if (!open) resetForm();
    onOpenChange(open);
  }

  function selectType(type: TxType) {
    setTxType(type);
    setStep("form");
  }

  const filteredCategories = categories.filter((c) => {
    if (txType === "expense") return c.type === "expense";
    if (txType === "income") return c.type === "income";
    if (txType === "fixed") return c.type === "fixed_system";
    return false;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (txType === "income" && !categoryId) {
      toast.error("Selecciona una categoría para el ingreso");
      return;
    }
    if (txType === "fixed" && !description.trim()) {
      toast.error("La descripción es requerida para gastos fijos");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let error;

    if (txType === "fixed") {
      ({ error } = await supabase.from("fixed_expenses").insert({
        user_id: user!.id,
        amount: parseFloat(amount),
        description,
        account_id: accountId,
        category_id: categoryId || null,
        start_date: startDate,
        end_date: endDate || null,
      }));
    } else {
      ({ error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        type: txType,
        amount: parseFloat(amount),
        description: description || null,
        account_id: accountId,
        category_id: categoryId || null,
        transaction_date: date,
      }));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registrado");
      handleOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

  const typeLabel =
    txType === "expense"
      ? "gasto"
      : txType === "income"
        ? "ingreso"
        : "gasto fijo";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {step === "type" ? (
          <>
            <SheetHeader>
              <SheetTitle>Nueva transacción</SheetTitle>
              <SheetDescription>¿Qué tipo de movimiento quieres registrar?</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 p-4 pt-0">
              <button
                onClick={() => selectType("expense")}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <Receipt className="h-6 w-6 text-orange-400" />
                <span className="text-sm font-medium">Gasto</span>
              </button>
              <button
                onClick={() => selectType("fixed")}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <CalendarClock className="h-6 w-6 text-blue-400" />
                <span className="text-sm font-medium">Gasto fijo</span>
              </button>
              <button
                onClick={() => selectType("income")}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <TrendingUp className="h-6 w-6 text-green-400" />
                <span className="text-sm font-medium">Ingreso</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setStep("type")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <SheetTitle>Nuevo {typeLabel}</SheetTitle>
              </div>
              <SheetDescription className="sr-only">
                Formulario para registrar un nuevo {typeLabel}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-4">
              {/* Descripción primero solo para gasto fijo */}
              {txType === "fixed" && (
                <div className="space-y-1">
                  <Label>Descripción *</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Netflix, Renta..."
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus={txType !== "fixed"}
                />
              </div>

              <div className="space-y-1">
                <Label>Cuenta</Label>
                <Select value={accountId} onValueChange={setAccountId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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

              <div className="space-y-1">
                <Label>
                  Categoría{txType === "income" ? " *" : ""}
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción para gasto/ingreso */}
              {txType !== "fixed" && (
                <div className="space-y-1">
                  <Label>Descripción</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              )}

              {/* Fecha para gasto/ingreso */}
              {txType !== "fixed" && (
                <div className="space-y-1">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Fechas para gasto fijo */}
              {txType === "fixed" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Fecha inicio</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha fin</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deja fecha fin vacía si es indefinido.
                  </p>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
