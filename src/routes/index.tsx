import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, QrCode, Ticket } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

const featuredQuery = queryOptions({
  queryKey: ["events", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, slug, city, venue, category, image_url, starts_at, featured")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQuery);
  },
  component: Landing,
});

function Landing() {
  const { data: events } = useSuspenseQuery(featuredQuery);
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Bilheteira premium moçambicana
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              Viva os melhores <span className="bg-[image:var(--gradient-gold)] bg-clip-text text-transparent">momentos</span> — sem filas.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Descubra concertos, conferências e galas. Compre o seu bilhete em segundos e receba um QR Code único no seu email e em PDF.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90 shadow-[var(--shadow-gold)]">
                <Link to="/events">Explorar eventos <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/60">
                <Link to="/auth">Criar conta</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
            {[
              { icon: QrCode, title: "QR único por bilhete", desc: "Códigos criptografados, impossíveis de duplicar." },
              { icon: ShieldCheck, title: "Pagamento seguro", desc: "M-Pesa, e-Mola, Visa e Mastercard." },
              { icon: Ticket, title: "Bilhete em PDF", desc: "Descarregue e receba por email instantaneamente." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5">
                <Icon className="h-6 w-6 text-gold" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured events */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Em destaque</h2>
            <p className="mt-2 text-muted-foreground">Os eventos mais aguardados da temporada.</p>
          </div>
          <Button asChild variant="ghost" className="text-gold hover:text-gold hover:bg-gold/10">
            <Link to="/events">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
          {events.length === 0 && (
            <p className="col-span-full text-muted-foreground">Sem eventos futuros publicados.</p>
          )}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 mt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TicketGo. Bilheteira premium.</p>
          <p>Feito com paixão em Moçambique 🇲🇿</p>
        </div>
      </footer>
    </main>
  );
}
