import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventForm } from "@/components/event-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency } from "@/lib/format";
import { Trash2, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/organizer/events/$id")({
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const eventQ = useQuery({
    queryKey: ["organizer-event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const typesQ = useQuery({
    queryKey: ["event-types", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_types").select("*").eq("event_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const attendeesQ = useQuery({
    queryKey: ["event-tickets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, buyer_name, buyer_email, price_paid, currency, status, checked_in, created_at, ticket_types(name)")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [newType, setNewType] = useState({ name: "", price: 0, quantity_total: 0 });

  const addType = async () => {
    if (!newType.name) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("ticket_types").insert({
      event_id: id, name: newType.name, price: newType.price, quantity_total: newType.quantity_total,
    });
    if (error) return toast.error(error.message);
    setNewType({ name: "", price: 0, quantity_total: 0 });
    qc.invalidateQueries({ queryKey: ["event-types", id] });
    toast.success("Tipo de bilhete adicionado");
  };

  const deleteType = async (typeId: string) => {
    const { error } = await supabase.from("ticket_types").delete().eq("id", typeId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["event-types", id] });
  };

  const exportCsv = () => {
    const rows = (attendeesQ.data ?? []).map((t) => ({
      nome: t.buyer_name, email: t.buyer_email, tipo: t.ticket_types?.name ?? "",
      preco: t.price_paid, moeda: t.currency, estado: t.status,
      check_in: t.checked_in ? "sim" : "não", comprado_em: t.created_at,
    }));
    downloadCsv(`participantes-${id}.csv`, rows);
  };

  if (eventQ.isLoading || !eventQ.data) return <p className="text-muted-foreground">A carregar…</p>;

  const tickets = attendeesQ.data ?? [];
  const revenue = tickets.reduce((s, t) => s + Number(t.price_paid ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <EventForm initial={eventQ.data} onSaved={() => qc.invalidateQueries({ queryKey: ["organizer-event", id] })} />

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-display text-lg font-bold mb-4">Tipos de bilhete</h3>
            <div className="space-y-2 mb-4">
              {(typesQ.data ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-muted-foreground">{formatCurrency(Number(t.price), t.currency)} • {t.quantity_sold}/{t.quantity_total} vendidos</p>
                  </div>
                  <button onClick={() => deleteType(t.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {(typesQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum tipo criado.</p>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3"><Label>Nome</Label><Input value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} placeholder="VIP, Normal…" /></div>
              <div><Label>Preço</Label><Input type="number" value={newType.price} onChange={(e) => setNewType({ ...newType, price: Number(e.target.value) })} /></div>
              <div><Label>Qtd</Label><Input type="number" value={newType.quantity_total} onChange={(e) => setNewType({ ...newType, quantity_total: Number(e.target.value) })} /></div>
              <div className="flex items-end"><Button onClick={addType} className="w-full">Adicionar</Button></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Participantes ({tickets.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV</Button>
                <Link to="/scan/$eventId" params={{ eventId: id }} className="text-sm px-3 py-2 rounded-lg border border-border/60 hover:bg-muted">Scanner</Link>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Receita: <span className="text-foreground font-semibold">{formatCurrency(revenue)}</span> •
              Check-ins: <span className="text-foreground font-semibold">{tickets.filter((t) => t.checked_in).length}</span>
            </p>
            <div className="mt-4 max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border/60">
                  <tr><th className="py-2">Nome</th><th>Tipo</th><th>Estado</th><th>Check-in</th></tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-border/40">
                      <td className="py-2">
                        <p className="font-medium">{t.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">{t.buyer_email}</p>
                      </td>
                      <td>{t.ticket_types?.name}</td>
                      <td>{t.status}</td>
                      <td>{t.checked_in ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}