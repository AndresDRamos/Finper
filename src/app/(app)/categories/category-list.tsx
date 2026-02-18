"use client";

import { Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const ICONS = ["🍔", "🚗", "🏠", "🎬", "💊", "🛒", "👕", "📱", "✈️", "🎓", "💇", "🎁", "🐕", "⚡", "💰", "📖", "💵", "🎮", "🏪", "📦", "🏦"];
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function CategoryList({ categories }: { categories: Category[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formType, setFormType] = useState<"expense" | "income">("expense");

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function openNew(type: "expense" | "income") {
    setEditing(null);
    setFormType(type);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setFormType(cat.type as "expense" | "income");
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <CategoryForm
          category={editing}
          categoryType={formType}
          onClose={() => setShowForm(false)}
        />
      )}

      <Tabs defaultValue="expense">
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">Gastos</TabsTrigger>
          <TabsTrigger value="income" className="flex-1">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-4 mt-3">
          <Button onClick={() => openNew("expense")} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Nueva categoría de gasto
          </Button>
          <CategoryGrid categories={expenseCategories} onEdit={openEdit} />
          {expenseCategories.length === 0 && !showForm && <SeedCategories type="expense" />}
        </TabsContent>

        <TabsContent value="income" className="space-y-4 mt-3">
          <Button onClick={() => openNew("income")} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Nueva categoría de ingreso
          </Button>
          <CategoryGrid categories={incomeCategories} onEdit={openEdit} />
          {incomeCategories.length === 0 && !showForm && <SeedCategories type="income" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryGrid({ categories, onEdit }: { categories: Category[]; onEdit: (c: Category) => void }) {
  const active = categories.filter((c) => c.is_active);
  const inactive = categories.filter((c) => !c.is_active);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {active.map((c) => (
          <Card
            key={c.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onEdit(c)}
          >
            <CardContent className="flex items-center gap-2 py-3 px-3">
              <span className="text-lg">{c.icon || "📁"}</span>
              <span className="text-sm font-medium truncate">{c.name}</span>
              <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: c.color || "#888" }} />
            </CardContent>
          </Card>
        ))}
      </div>

      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Inactivas</p>
          <div className="grid grid-cols-2 gap-2 opacity-50">
            {inactive.map((c) => (
              <Card key={c.id} className="cursor-pointer" onClick={() => onEdit(c)}>
                <CardContent className="flex items-center gap-2 py-3 px-3">
                  <span className="text-lg">{c.icon || "📁"}</span>
                  <span className="text-sm truncate">{c.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CategoryForm({ category, categoryType, onClose }: { category: Category | null; categoryType: "expense" | "income"; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "📁");
  const [color, setColor] = useState(category?.color ?? COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = { user_id: user!.id, name, icon, color, type: categoryType };

    const { error } = category
      ? await supabase.from("categories").update(payload).eq("id", category.id)
      : await supabase.from("categories").insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(category ? "Categoría actualizada" : "Categoría creada");
      onClose();
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive() {
    if (!category) return;
    const supabase = createClient();
    await supabase.from("categories").update({ is_active: !category.is_active }).eq("id", category.id);
    toast.success(category.is_active ? "Desactivada" : "Activada");
    onClose();
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-medium text-sm">
            {category ? "Editar" : "Nueva"} categoría de {categoryType === "income" ? "ingreso" : "gasto"}
          </p>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Comida" required />
          </div>
          <div className="space-y-1">
            <Label>Ícono</Label>
            <div className="flex flex-wrap gap-1">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-8 h-8 rounded text-lg flex items-center justify-center ${icon === i ? "bg-accent ring-1 ring-primary" : ""}`}
                  onClick={() => setIcon(i)}
                >{i}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>Guardar</Button>
            {category && (
              <Button type="button" variant="ghost" onClick={toggleActive} className="text-xs">
                {category.is_active ? "Desactivar" : "Activar"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SeedCategories({ type }: { type: "expense" | "income" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const expenseSeeds = [
    { name: "Comida", icon: "🍔", color: "#ef4444" },
    { name: "Transporte", icon: "🚗", color: "#3b82f6" },
    { name: "Hogar", icon: "🏠", color: "#22c55e" },
    { name: "Entretenimiento", icon: "🎬", color: "#8b5cf6" },
    { name: "Salud", icon: "💊", color: "#ec4899" },
    { name: "Abarrotes", icon: "🛒", color: "#f59e0b" },
    { name: "Ropa", icon: "👕", color: "#06b6d4" },
    { name: "Servicios", icon: "⚡", color: "#f97316" },
  ];

  const incomeSeeds = [
    { name: "Nómina", icon: "💵", color: "#22c55e" },
    { name: "Aguinaldo", icon: "🎁", color: "#f59e0b" },
    { name: "Fondo de ahorro", icon: "🏦", color: "#3b82f6" },
  ];

  const seeds = type === "expense" ? expenseSeeds : incomeSeeds;

  async function handleSeed() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from("categories")
      .select("name")
      .eq("type", type)
      .eq("user_id", user!.id);

    const existingNames = new Set(existing?.map((c) => c.name) ?? []);
    const toInsert = seeds
      .filter((s) => !existingNames.has(s.name))
      .map((s) => ({ ...s, user_id: user!.id, type }));

    if (toInsert.length === 0) {
      toast.info("Todas las categorías ya existen");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("categories").insert(toInsert);

    if (error) toast.error(error.message);
    else {
      toast.success("Categorías creadas");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSeed} disabled={loading}>
      {loading ? "Creando..." : `Cargar categorías de ${type === "income" ? "ingreso" : "gasto"} predeterminadas`}
    </Button>
  );
}
