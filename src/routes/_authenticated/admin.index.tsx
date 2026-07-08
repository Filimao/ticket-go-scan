import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, roles, events, tickets, settings] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("events").select("id, status", { count: "exact" }),
        supabase.from("tickets").select("price_paid, status"),
        supabase.from("platform_settings").select("*").eq("id", 1).single(),
      ]);
      const rolesArr = roles.data ?? [];
      const tArr = tickets.data ?? [];
      const revenue = tArr.filter((t) => t.status !== "cancelled").reduce((s, t) => s + Number(t.price_paid ?? 0), 0);
      const s = settings.data;
      const commission = s
        ? s.commission_type === "percentage"
          ? (revenue * Number(s.commission_value)) / 100
          : Number(s.commission_value) * tArr.length
        : 0;
      return {
        users: users.count ?? 0,
        organizers: rolesArr.filter((r) => r.role === "organizer").length,
        events: events.count ?? 0,
        tickets: tArr.length,
        revenue,
        commission,
      };
    },
  });
  if (isLoading || !data) return <p className="text-muted-foreground">A carregar…</p>;
  const cards = [
    { label: "Utilizadores", value: data.users.toString() },
    { label: "Organizadores", value: data.organizers.toString() },
    { label: "Eventos", value: data.events.toString() },
    { label: "Bilhetes vendidos", value: data.tickets.toString() },
    { label: "Receita total", value: formatCurrency(data.revenue) },
    { label: "Comissão acumulada", value: formatCurrency(data.commission) },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
          <p className="font-display text-3xl font-bold mt-2 text-gold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}