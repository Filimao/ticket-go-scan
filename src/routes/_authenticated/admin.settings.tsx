import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState(10);
  useEffect(() => { if (data) { setType(data.commission_type); setValue(Number(data.commission_value)); } }, [data]);

  const save = async () => {
    const { error } = await supabase.from("platform_settings").update({
      commission_type: type, commission_value: value, updated_by: user?.id, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    if (user) await supabase.from("admin_logs").insert({ admin_id: user.id, action: "settings.commission", metadata: { type, value } });
    qc.invalidateQueries({ queryKey: ["platform-settings"] });
    toast.success("Comissão atualizada");
  };

  return (
    <div className="max-w-md space-y-5 rounded-2xl border border-border/60 bg-card p-6">
      <div>
        <h3 className="font-display text-lg font-bold">Comissão da plataforma</h3>
        <p className="text-sm text-muted-foreground">Percentagem sobre a receita ou valor fixo por bilhete.</p>
      </div>
      <div>
        <Label>Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentagem (%)</SelectItem>
            <SelectItem value="fixed">Valor fixo por bilhete</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Valor</Label>
        <Input type="number" step="0.01" value={value} onChange={(e) => setValue(Number(e.target.value))} />
      </div>
      <Button onClick={save} className="bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90">Guardar</Button>
    </div>
  );
}