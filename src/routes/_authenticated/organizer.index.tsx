import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatCurrency, formatEventDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Users, TicketCheck, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/organizer/")({
  component: OrganizerDashboard,
});

function OrganizerDashboard() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["organizer-events", user?.id],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*, ticket_types(id, name, price, currency, quantity_total, quantity_sold), tickets(id, price_paid, checked_in, status, buyer_name, buyer_email, created_at, ticket_types(name))")
        .eq("organizer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return events;
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase.rpc("confirm_ticket_payment", { _ticket_id: ticketId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento confirmado! Bilhete ativado.");
      qc.invalidateQueries({ queryKey: ["organizer-events", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectPayment = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase.rpc("reject_ticket_payment", { _ticket_id: ticketId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bilhete rejeitado.");
      qc.invalidateQueries({ queryKey: ["organizer-events", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
              <Skeleton className="h-3 w-20 bg-muted" />
              <Skeleton className="mt-3 h-8 md:h-9 w-24 bg-muted" />
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-6 w-40 bg-muted mb-4" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-5 w-1/2 bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-3 w-32 bg-muted" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20 bg-muted" />
                  <Skeleton className="h-9 w-20 bg-muted" />
                  <Skeleton className="h-9 w-20 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const events = data ?? [];
  const totals = events.reduce(
    (acc, e) => {
      const tickets = e.tickets ?? [];
      acc.sold += tickets.filter((t) => t.status !== "cancelled" && t.status !== "pending_payment").length;
      acc.revenue += tickets.filter((t) => t.status !== "pending_payment").reduce((s, t) => s + Number(t.price_paid ?? 0), 0);
      acc.checked += tickets.filter((t) => t.checked_in).length;
      return acc;
    },
    { sold: 0, revenue: 0, checked: 0 },
  );

  const pendingTickets = events.flatMap((e) =>
    (e.tickets ?? [])
      .filter((t) => t.status === "pending_payment")
      .map((t) => ({ ...t, eventTitle: e.title, eventId: e.id }))
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Eventos" value={events.length.toString()} />
        <StatCard label="Bilhetes vendidos" value={totals.sold.toString()} />
        <StatCard label="Check-ins" value={totals.checked.toString()} />
        <StatCard label="Receita" value={formatCurrency(totals.revenue)} />
      </div>

      {pendingTickets.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Pagamentos pendentes
            <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
              {pendingTickets.length}
            </Badge>
          </h2>
          <div className="grid gap-3">
            {pendingTickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.buyer_name} <span className="text-muted-foreground font-normal">— {t.eventTitle}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.buyer_email} • {t.ticket_types?.name ?? "Bilhete"} • {formatCurrency(Number(t.price_paid))}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => confirmPayment.mutate(t.id)}
                    disabled={confirmPayment.isPending || rejectPayment.isPending}
                    className="bg-emerald-500/90 hover:bg-emerald-500 text-white w-full sm:w-auto"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectPayment.mutate(t.id)}
                    disabled={confirmPayment.isPending || rejectPayment.isPending}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-xl font-bold mb-4">Os teus eventos</h2>
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-muted-foreground">Ainda não criaste eventos.</p>
            <Link to="/organizer/events/new" className="mt-3 inline-block text-gold font-semibold">Criar o primeiro evento →</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((e) => {
              const totalCap = (e.ticket_types ?? []).reduce((s, t) => s + t.quantity_total, 0);
              const sold = (e.ticket_types ?? []).reduce((s, t) => s + t.quantity_sold, 0);
              return (
                <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{e.title}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatEventDate(e.starts_at)} • {e.venue ?? "—"}, {e.city ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Vendidos: <span className="text-foreground font-medium">{sold}</span> / {totalCap}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link to="/organizer/events/$id" params={{ id: e.id }} className="text-sm px-3 py-2 rounded-lg border border-border/60 hover:bg-muted flex items-center justify-center gap-1 w-full sm:w-auto">
                      <Pencil className="h-3.5 w-3.5" />Editar
                    </Link>
                    <Link to="/scan/$eventId" params={{ eventId: e.id }} className="text-sm px-3 py-2 rounded-lg border border-border/60 hover:bg-muted flex items-center justify-center gap-1 w-full sm:w-auto">
                      <TicketCheck className="h-3.5 w-3.5" />Scan
                    </Link>
                    <Link to="/events/$id" params={{ id: e.id }} className="text-sm px-3 py-2 rounded-lg border border-border/60 hover:bg-muted flex items-center justify-center gap-1 w-full sm:w-auto">
                      <Users className="h-3.5 w-3.5" />Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold mt-2 break-words">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    draft: "bg-muted text-muted-foreground border-border/60",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    ended: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}
