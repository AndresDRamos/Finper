"use client";

import { createClient } from "@/lib/supabase/client";
import { UserSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savingsPct, setSavingsPct] = useState("20");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("user_settings").select("*").single();
      if (data) {
        setSettings(data);
        setSavingsPct(data.savings_percentage.toString());
      }
    }
    load();
  }, []);

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("user_settings")
      .update({ savings_percentage: parseFloat(savingsPct), updated_at: new Date().toISOString() })
      .eq("id", settings!.id);
    if (error) toast.error(error.message);
    else toast.success("Configuración guardada");
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ahorro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Porcentaje de ahorro (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={savingsPct}
              onChange={(e) => setSavingsPct(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se reserva este % de tu ingreso promedio como ahorro
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
      </Button>
    </div>
  );
}
