import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  component: AdminLogs,
});

function AdminLogs() {
  const { data } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border/60 bg-muted/30">
          <tr><th className="p-3">Data</th><th>Ação</th><th>Alvo</th><th>Detalhes</th></tr>
        </thead>
        <tbody>
          {(data ?? []).map((l) => (
            <tr key={l.id} className="border-b border-border/40">
              <td className="p-3 text-xs">{new Date(l.created_at).toLocaleString("pt-PT")}</td>
              <td className="font-medium">{l.action}</td>
              <td className="text-xs text-muted-foreground">{l.target_type} {l.target_id?.slice(0, 8)}</td>
              <td className="text-xs text-muted-foreground">{l.metadata ? JSON.stringify(l.metadata) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}