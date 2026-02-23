"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/icon-picker";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryType: "expense" | "income";
  category?: Category | null;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  categoryType,
  category,
}: CategoryFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setIcon(category?.icon ?? null);
    }
  }, [open, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user!.id,
      name,
      icon,
      color: null,
      type: categoryType,
    };

    const { error } = category
      ? await supabase.from("categories").update(payload).eq("id", category.id)
      : await supabase.from("categories").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(category ? "Categoría actualizada" : "Categoría creada");
      onOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive() {
    if (!category) return;
    const supabase = createClient();
    await supabase
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("id", category.id);
    toast.success(category.is_active ? "Categoría desactivada" : "Categoría activada");
    onOpenChange(false);
    router.refresh();
  }

  const typeLabel = categoryType === "income" ? "ingreso" : "gasto";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar" : "Nueva"} categoría de {typeLabel}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={categoryType === "income" ? "Nómina" : "Comida"}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Ícono</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            {category && (
              <Button
                type="button"
                variant="outline"
                onClick={toggleActive}
                className="text-xs"
              >
                {category.is_active ? "Desactivar" : "Activar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
