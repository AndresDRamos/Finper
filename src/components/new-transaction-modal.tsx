"use client";

import { Account, Category, Transaction, FixedExpense } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicIcon } from "./dynamic-icon";
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
import {
  ArrowLeft,
  Receipt,
  CalendarClock,
  TrendingUp,
  Trash2,
} from "lucide-react";

type TxType = "expense" | "income" | "fixed";

export type TransactionEditing =
  | { kind: "transaction"; data: Transaction }
  | { kind: "fixed"; data: FixedExpense };

export function NewTransactionModal({
  open,
  onOpenChange,
  accounts,
  categories,
  editing = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  editing?: TransactionEditing | null;
}) {
  const router = useRouter();

  const initialType: TxType = editing
    ? editing.kind === "fixed"
      ? "fixed"
      : editing.data.type
    : "expense";

  const [step, setStep] = useState<"type" | "form">(
    editing ? "form" : "type",
  );
  const [txType, setTxType] = useState<TxType>(initialType);
  const [loading, setLoading] = useState(false);

  const initialStartDate =
    editing?.kind === "fixed"
      ? editing.data.start_date
      : new Date().toISOString().split("T")[0];
  const initialDate =
    editing?.kind === "transaction"
      ? editing.data.transaction_date
      : new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState(
    editing ? String(editing.data.amount) : "",
  );
  const [description, setDescription] = useState(
    editing ? (editing.data.description ?? "") : "",
  );
  const [accountId, setAccountId] = useState(
    editing ? editing.data.account_id : "",
  );
  const [categoryId, setCategoryId] = useState(
    editing ? (editing.data.category_id ?? "") : "",
  );
  const [date, setDate] = useState(initialDate);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(
    editing?.kind === "fixed" ? (editing.data.end_date ?? "") : "",
  );

  function resetForm() {
    setStep("type");
    setTxType("expense");
    setAmount("");
    setDescription("");
    setAccountId("");
    setCategoryId("");
    setDate(new Date().toISOString().split("T")[0]);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
  }

  function handleOpenChange(open: boolean) {
    if (!open && !editing) resetForm();
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

  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);

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
      const payload = {
        user_id: user!.id,
        amount: parseFloat(amount),
        description,
        account_id: accountId,
        category_id: categoryId || null,
        start_date: startDate,
        end_date: endDate || null,
      };
      ({ error } =
        editing?.kind === "fixed"
          ? await supabase
              .from("fixed_expenses")
              .update(payload)
              .eq("id", editing.data.id)
          : await supabase.from("fixed_expenses").insert(payload));
    } else {
      const payload = {
        user_id: user!.id,
        type: txType,
        amount: parseFloat(amount),
        description: description || null,
        account_id: accountId,
        category_id: categoryId || null,
        transaction_date: date,
      };
      ({ error } =
        editing?.kind === "transaction"
          ? await supabase
              .from("transactions")
              .update(payload)
              .eq("id", editing.data.id)
          : await supabase.from("transactions").insert(payload));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editing ? "Actualizado" : "Registrado");
      handleOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!editing) return;
    const label =
      editing.kind === "fixed" ? "este gasto fijo" : "esta transacción";
    if (!confirm(`¿Eliminar ${label}?`)) return;

    const supabase = createClient();
    const table =
      editing.kind === "fixed" ? "fixed_expenses" : "transactions";
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", editing.data.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Eliminado");
    handleOpenChange(false);
    router.refresh();
  }

  const typeLabel =
    txType === "expense"
      ? "gasto"
      : txType === "income"
        ? "ingreso"
        : "gasto fijo";

  const iconColor = selectedCategory?.color ?? null;
  const iconBg = iconColor ? `${iconColor}1a` : undefined;
  const fallbackGlyph =
    txType === "income" ? "↑" : txType === "fixed" ? "↻" : "↓";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-0 pb-0"
      >
        {step === "type" ? (
          <>
            <SheetHeader>
              <SheetTitle>Nueva transacción</SheetTitle>
              <SheetDescription>
                ¿Qué tipo de movimiento quieres registrar?
              </SheetDescription>
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
            {/* Handle */}
            <div className="flex justify-center pt-1 pb-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            <SheetHeader className="px-5 pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                {!editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setStep("type")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}

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
                        {fallbackGlyph}
                      </span>
                    }
                  />
                </span>

                <SheetTitle className="text-left font-semibold">
                  {editing ? "Editar" : "Nuevo"} {typeLabel}
                </SheetTitle>

                {editing && (
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
              <SheetDescription className="sr-only">
                Formulario para {editing ? "editar" : "registrar"} un {typeLabel}
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={handleSubmit}
              className="px-5 pt-5 pb-10 space-y-5"
            >
              {/* Amount — prominent */}
              <div className="flex items-baseline justify-center gap-1 py-4 border-b border-border/40">
                <span className="text-2xl text-muted-foreground/50 font-mono">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus={txType !== "fixed"}
                  className="w-full text-3xl font-semibold font-mono tabular-nums text-center bg-transparent border-none outline-none placeholder:text-muted-foreground/25 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Descripción primero solo para gasto fijo */}
              {txType === "fixed" && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Descripción *
                  </Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Netflix, Renta…"
                    required
                    autoFocus={!editing}
                    className="bg-muted/20 border-border/50"
                  />
                </div>
              )}

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Categoría{txType === "income" ? " *" : ""}
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

              {/* Descripción para gasto/ingreso */}
              {txType !== "fixed" && (
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
              )}

              {/* Fecha única para gasto/ingreso */}
              {txType !== "fixed" && (
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
              )}

              {/* Fechas para gasto fijo */}
              {txType === "fixed" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Inicio
                      </Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="bg-muted/20 border-border/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Fin
                      </Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-muted/20 border-border/50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Deja fecha fin vacía si es indefinido.
                  </p>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando…" : "Guardar"}
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
