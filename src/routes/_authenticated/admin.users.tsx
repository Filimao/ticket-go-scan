import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      const rolesByUser = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
  });

  const log = async (action: string, target_id: string) => {
    if (user) await supabase.from("admin_logs").insert({ admin_id: user.id, action, target_type: "user", target_id });
  };

  const toggleBlock = async (id: string, isBlocked: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_blocked: !isBlocked }).eq("id", id);
    if (error) return toast.error(error.message);
    await log(isBlocked ? "user.unblock" : "user.block", id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const setRole = async (id: string, role: "organizer" | "admin", enable: boolean) => {
    if (enable) {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", role);
      if (error) return toast.error(error.message);
    }
    await log(enable ? `role.grant.${role}` : `role.revoke.${role}`, id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border/60 bg-muted/30">
          <tr><th className="p-3">Nome</th><th>Papéis</th><th>Estado</th><th className="text-right pr-3">Ações</th></tr>
        </thead>
        <tbody>
          {(data ?? []).map((u) => {
            const isOrg = u.roles.includes("organizer");
            const isAdm = u.roles.includes("admin");
            return (
              <tr key={u.id} className="border-b border-border/40">
                <td className="p-3">
                  <p className="font-medium">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[220px]">{u.id}</p>
                </td>
                <td className="space-x-1">
                  {u.roles.map((r) => <span key={r} className="px-2 py-0.5 rounded bg-muted text-xs">{r}</span>)}
                </td>
                <td>{u.is_blocked ? <span className="text-red-400 text-xs">Bloqueado</span> : <span className="text-emerald-400 text-xs">Ativo</span>}</td>
                <td className="text-right pr-3 space-x-1">
                  <Button size="sm" variant="outline" onClick={() => setRole(u.id, "organizer", !isOrg)}>{isOrg ? "− Organiz." : "+ Organiz."}</Button>
                  <Button size="sm" variant="outline" onClick={() => setRole(u.id, "admin", !isAdm)}>{isAdm ? "− Admin" : "+ Admin"}</Button>
                  <Button size="sm" variant={u.is_blocked ? "outline" : "destructive"} onClick={() => toggleBlock(u.id, u.is_blocked)}>{u.is_blocked ? "Desbloquear" : "Bloquear"}</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}