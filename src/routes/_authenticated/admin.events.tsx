import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/admin/events")({
  component: AdminEvents,
});

function AdminEvents() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, status: string, action: string) => {
    const { error } = await supabase.from("events").update({ status: status as "published" }).eq("id", id);
    if (error) return toast.error(error.message);
    if (user) await supabase.from("admin_logs").insert({ admin_id: user.id, action, target_type: "event", target_id: id });
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    toast.success("Atualizado");
  };

  const remove = async (id: string) => {
    if (!confirm("Remover evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (user) await supabase.from("admin_logs").insert({ admin_id: user.id, action: "event.delete", target_type: "event", target_id: id });
    qc.invalidateQueries({ queryKey: ["admin-events"] });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border/60 bg-muted/30">
          <tr><th className="p-3">Evento</th><th>Data</th><th>Estado</th><th className="text-right pr-3">Ações</th></tr>
        </thead>
        <tbody>
          {(data ?? []).map((e) => (
            <tr key={e.id} className="border-b border-border/40">
              <td className="p-3">
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.city ?? "—"}</p>
              </td>
              <td>{formatEventDate(e.starts_at)}</td>
              <td><span className="px-2 py-0.5 rounded bg-muted text-xs">{e.status}</span></td>
              <td className="text-right pr-3 space-x-1">
                {(e.status === "pending" || e.status === "draft") && (
                  <Button size="sm" onClick={() => update(e.id, "published", "event.approve")}>Aprovar</Button>
                )}
                {e.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => update(e.id, "rejected", "event.reject")}>Rejeitar</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => remove(e.id)}>Remover</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}