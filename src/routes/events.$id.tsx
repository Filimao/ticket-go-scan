import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Minus, Plus, Ticket as TicketIcon, ArrowLeft, Sparkles } from "lucide-react";
import { formatCurrency, formatEventDate, formatEventTime } from "@/lib/format";
import { toast } from "sonner";

const eventQuery = (id: string) => queryOptions({
  queryKey: ["event", id],
  queryFn: async () => {
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!event) throw new Error("Evento não encontrado");
    const { data: types, error: e2 } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", id)
      .order("sort_order", { ascending: true });
    if (e2) throw e2;
    return { event, types };
  },
});

export const Route = createFileRoute("/events/$id")({
  loader: ({ context, params }) => { context.queryClient.ensureQueryData(eventQuery(params.id)); },
  head: () => ({ meta: [{ title: "Detalhes do evento — TicketGo" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(eventQuery(id));
  const { event, types } = data;
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useSession();

  const [selectedTypeId, setSelectedTypeId] = useState<string>(types[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");

  const selected = types.find(t => t.id === selectedTypeId) ?? types[0];
  const total = selected ? Number(selected.price) * qty : 0;
  const totalAvailable = types.reduce((s, t) => s + Math.max(0, t.quantity_total - t.quantity_sold), 0);
  const totalCapacity = types.reduce((s, t) => s + t.quantity_total, 0);

  const buy = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!selected) throw new Error("Selecione um tipo de bilhete");
      const rows = Array.from({ length: qty }).map(() => ({
        user_id: user.id,
        event_id: event.id,
        ticket_type_id: selected.id,
        buyer_name: buyerName || (user.email ?? "Convidado"),
        buyer_email: buyerEmail || user.email!,
        buyer_whatsapp: buyerWhatsapp || null,
        price_paid: Number(selected.price),
        currency: selected.currency,
        qr_code: `TG-${event.id.slice(0,8)}-${crypto.randomUUID()}`,
      }));
      const { data, error } = await supabase.from("tickets").insert(rows).select("id");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["event", event.id] });
      toast.success("Compra confirmada! Bilhetes emitidos.", {
        description: "Envie o pagamento M-Pesa/ eMola para 850113678/ 866955676 e apresente o QR à entrada.",
      });
      if (buyerWhatsapp) {
        const num = buyerWhatsapp.replace(/\D/g, "");
        const msg = encodeURIComponent(
          `Olá ${buyerName || "cliente"}! O seu bilhete para "${event.title}" foi emitido. Aceda em https://ticketgomz.vercel.app/tickets para descarregar o PDF com o QR code. Obrigado por escolher TicketGo!`
        );
        window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
      }
      router.navigate({ to: "/tickets" });
    },
    onError: (err: Error) => {
      if (err.message === "auth") router.navigate({ to: "/auth" });
      else toast.error(err.message);
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link to="/events"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos eventos</Link>
      </Button>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border/60">
            {event.image_url && <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 to-transparent" />
            {event.category && (
              <span className="absolute left-6 top-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy-deep">
                {event.category}
              </span>
            )}
          </div>

          <h1 className="mt-8 font-display text-4xl md:text-5xl font-bold leading-tight">{event.title}</h1>

          <div className="mt-6 flex flex-wrap gap-6 text-muted-foreground">
            <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> {formatEventDate(event.starts_at)} • {formatEventTime(event.starts_at)}</span>
            {(event.venue || event.city) && (
              <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> {[event.venue, event.city].filter(Boolean).join(", ")}</span>
            )}
          </div>

          {event.description && (
            <div className="prose prose-invert mt-8 max-w-none">
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">{event.description}</p>
            </div>
          )}
        </div>

        {/* Purchase panel */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-elegant)]">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-gold" /> Escolha o seu bilhete
            </h2>

            {totalCapacity > 0 && (
              <div className="mt-3 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bilhetes restantes</span>
                  <span className="font-semibold text-gold">{totalAvailable} / {totalCapacity}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {types.map((t) => {
                    const av = Math.max(0, t.quantity_total - t.quantity_sold);
                    return (
                      <div key={t.id} className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t.name}</span>
                        <span className={av === 0 ? "text-destructive font-semibold" : "text-foreground"}>
                          {av === 0 ? "Esgotado" : `${av} restantes`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {types.map((t) => {
                const available = t.quantity_total - t.quantity_sold;
                const disabled = available <= 0;
                const active = selectedTypeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      active ? "border-gold bg-gold/10" : "border-border/60 hover:border-gold/50"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {t.name === "VIP" && <Sparkles className="h-4 w-4 text-gold" />}
                          {t.name}
                        </p>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                        <p className="text-[11px] text-muted-foreground mt-1">{available > 0 ? `${available} disponíveis` : "Esgotado"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-gold">{formatCurrency(Number(t.price), t.currency)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {types.length === 0 && <p className="text-sm text-muted-foreground">Sem bilhetes disponíveis.</p>}
            </div>

            {selected && (
              <>
                <div className="mt-6">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantidade</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
                    <span className="w-10 text-center font-semibold text-lg">{qty}</span>
                    <Button type="button" variant="outline" size="icon" onClick={() => setQty(Math.min(10, qty + 1))}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>

                {user && (
                  <div className="mt-4 grid gap-3">
                    <div>
                      <Label htmlFor="bn" className="text-xs uppercase tracking-wider text-muted-foreground">Nome do comprador</Label>
                      <Input id="bn" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nome completo" className="mt-1 bg-background border-border/60" />
                    </div>
                    <div>
                      <Label htmlFor="be" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input id="be" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder={user.email ?? ""} className="mt-1 bg-background border-border/60" />
                    </div>
                    <div>
                      <Label htmlFor="bw" className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp (opcional)</Label>
                      <Input id="bw" type="tel" value={buyerWhatsapp} onChange={(e) => setBuyerWhatsapp(e.target.value)} placeholder="+258 84 123 4567" className="mt-1 bg-background border-border/60" />
                      <p className="mt-1 text-[10px] text-muted-foreground">Após a compra, abrimos o WhatsApp com o link do seu bilhete.</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-gold">{formatCurrency(total, selected.currency)}</span>
                </div>

                {user ? (
                  <Button
                    onClick={() => buy.mutate()}
                    disabled={buy.isPending}
                    className="mt-4 w-full bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90 h-11 shadow-[var(--shadow-gold)]"
                  >
                    {buy.isPending ? "A processar…" : "Comprar bilhetes"}
                  </Button>
                ) : (
                  <Button asChild className="mt-4 w-full bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90 h-11">
                    <Link to="/auth">Iniciar sessão para comprar</Link>
                  </Button>
                )}

                <p className="mt-4 text-[11px] text-center text-muted-foreground leading-relaxed">
                  Pagamento por <strong>M-Pesa/ eMola</strong> para <strong className="text-gold">850113678/ 866955676</strong>. Após pagar, o bilhete é enviado por email e disponível em PDF.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}