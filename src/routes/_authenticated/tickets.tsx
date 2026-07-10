import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Download, QrCode, Ticket, MessageCircle } from "lucide-react";
import { formatCurrency, formatEventDate, formatEventTime } from "@/lib/format";
import { downloadTicketPdf } from "@/lib/ticket-pdf";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({ meta: [{ title: "Meus bilhetes — TicketGo" }, { name: "robots", content: "noindex" }] }),
  component: TicketsPage,
});

interface TicketRow {
  id: string;
  qr_code: string;
  buyer_name: string;
  buyer_email: string;
  buyer_whatsapp: string | null;
  price_paid: number;
  currency: string;
  status: string;
  created_at: string;
  events: { id: string; title: string; starts_at: string; city: string | null; venue: string | null; image_url: string | null } | null;
  ticket_types: { name: string } | null;
}

function TicketsPage() {
  const { user } = useSession();
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, qr_code, buyer_name, buyer_email, buyer_whatsapp, price_paid, currency, status, created_at, events(id, title, starts_at, city, venue, image_url), ticket_types(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TicketRow[];
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <header className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Meus bilhetes</h1>
        <p className="mt-2 text-muted-foreground">Todos os seus bilhetes digitais num só lugar.</p>
      </header>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid md:grid-cols-[1fr_auto] gap-6 rounded-3xl border border-border/60 bg-card p-6">
              <div className="min-w-0 space-y-3">
                <Skeleton className="h-7 w-2/3 bg-muted" />
                <div className="grid sm:grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-40 bg-muted" />
                  <Skeleton className="h-4 w-48 bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                  <Skeleton className="h-4 w-36 bg-muted" />
                </div>
                <Skeleton className="h-9 w-40 bg-muted mt-2" />
              </div>
              <div className="grid place-items-center">
                <Skeleton className="h-32 w-32 rounded-2xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!tickets || tickets.length === 0) && (
        <div className="rounded-3xl border border-border/60 bg-card p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-gold" />
          <p className="mt-4 text-muted-foreground">Ainda não comprou nenhum bilhete.</p>
          <Button asChild className="mt-6 bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90">
            <Link to="/events">Explorar eventos</Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {tickets?.map((t) => <TicketCard key={t.id} t={t} />)}
      </div>
    </main>
  );
}

function TicketCard({ t }: { t: TicketRow }) {
  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    if (t.status !== "valid") return;
    QRCode.toDataURL(t.qr_code, { errorCorrectionLevel: "H", margin: 1, width: 256 }).then(setQrUrl);
  }, [t.qr_code, t.status]);

  const dl = async () => {
    if (!t.events) return;
    try {
      await downloadTicketPdf({
        id: t.id,
        qrCode: t.qr_code,
        eventTitle: t.events.title,
        eventDate: t.events.starts_at,
        venue: t.events.venue,
        city: t.events.city,
        ticketTypeName: t.ticket_types?.name ?? "Bilhete",
        buyerName: t.buyer_name,
        pricePaid: Number(t.price_paid),
        currency: t.currency,
      });
    } catch (e) {
      toast.error("Erro ao gerar PDF");
      console.error(e);
    }
  };

  const statusColor = t.status === "valid" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : t.status === "pending_payment" ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : t.status === "used" ? "text-muted-foreground bg-muted border-border"
    : "text-destructive bg-destructive/10 border-destructive/30";

  const statusLabel = t.status === "valid" ? "Válido"
    : t.status === "pending_payment" ? "Aguarda pagamento"
    : t.status === "used" ? "Utilizado"
    : "Cancelado";

  return (
    <div className="grid md:grid-cols-[1fr_auto] gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display text-2xl font-bold truncate">{t.events?.title ?? "Evento"}</h2>
          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          {t.events && <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {formatEventDate(t.events.starts_at)} • {formatEventTime(t.events.starts_at)}</p>}
          {t.events && (t.events.venue || t.events.city) && (
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {[t.events.venue, t.events.city].filter(Boolean).join(", ")}</p>
          )}
          <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-gold" /> {t.ticket_types?.name}</p>
          <p className="flex items-center gap-2"><QrCode className="h-4 w-4 text-gold" /> ID {t.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-display text-xl font-bold text-gold">{formatCurrency(Number(t.price_paid), t.currency)}</span>
          {t.status === "valid" && (
            <Button onClick={dl} size="sm" variant="outline" className="border-border/60"><Download className="h-4 w-4 mr-2" /> Baixar PDF</Button>
          )}
          {t.status === "valid" && (
            <Button
              onClick={() => {
                const num = (t.buyer_whatsapp ?? "").replace(/\D/g, "");
                const msg = encodeURIComponent(
                  `O meu bilhete TicketGo para "${t.events?.title ?? "evento"}" — ID ${t.id.slice(0,8).toUpperCase()}. Baixe o PDF em https://ticketgomz.vercel.app/tickets`
                );
                window.open(num ? `https://wa.me/${num}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
              }}
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
          )}
        </div>
        {t.status === "pending_payment" && (
          <p className="mt-3 text-xs text-amber-400/90 leading-relaxed">
            Envie o pagamento M-Pesa para <strong>+258 850 147 162</strong> e aguarde a confirmação do organizador. O QR code fica disponível assim que o pagamento for validado.
          </p>
        )}
      </div>
      <div className="grid place-items-center">
        {t.status === "valid" ? (
          <div className="rounded-2xl bg-white p-3 shadow-lg">
            {qrUrl && <img src={qrUrl} alt="QR" className="h-32 w-32" />}
          </div>
        ) : t.status === "pending_payment" ? (
          <div className="rounded-2xl border border-dashed border-amber-500/40 p-6 text-center text-xs text-amber-400/80 h-32 w-32 flex items-center justify-center">
            Pendente
          </div>
        ) : null}
      </div>
    </div>
  );
}
