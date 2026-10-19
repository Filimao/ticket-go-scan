import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, QrCode, Ticket, Search, CreditCard, Megaphone } from "lucide-react";
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
  head: () => ({
    meta: [
      { title: "TicketGo — Bilhetes para os grandes eventos em Moçambique" },
      { name: "description", content: "Compre bilhetes para concertos, festas e conferências com M-Pesa e e-Mola. QR Code único e PDF instantâneo." },
      { property: "og:title", content: "TicketGo — No coração dos grandes eventos" },
      { property: "og:description", content: "Bilheteira digital moçambicana: compre em segundos e entre com QR Code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQuery);
  },
  component: Landing,
});

function Landing() {
  const { data: events } = useSuspenseQuery(featuredQuery);
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-30" width={1920} height={1080} />
          <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-electric/40 bg-electric/10 px-3 py-1 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Bilheteira digital moçambicana
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            No coração dos <span className="bg-[image:var(--gradient-gold)] bg-clip-text text-transparent">grandes</span> eventos
          </h1>
          <p className="mx-auto mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Concertos, festas e conferências. Pague com M-Pesa ou e-Mola e receba o seu bilhete com QR Code em segundos.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild size="lg" className="bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90 shadow-[var(--shadow-gold)]">
              <Link to="/events">Explorar eventos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-electric/50 bg-electric/10 hover:bg-electric/20">
              <Link to="/auth">Criar conta</Link>
            </Button>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { v: "100%", l: "Digital" },
              { v: "QR", l: "Único por bilhete" },
              { v: "24/7", l: "Compra online" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-4">
                <div className="font-display text-2xl md:text-4xl font-bold text-gold">{s.v}</div>
                <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric">Próximos eventos</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold">Em destaque</h2>
          </div>
          <Button asChild variant="ghost" className="text-gold hover:text-gold hover:bg-gold/10">
            <Link to="/events">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
          {events.length === 0 && (
            <p className="col-span-full text-muted-foreground">Sem eventos futuros publicados.</p>
          )}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <h2 className="text-center font-display text-3xl md:text-4xl font-bold">Como funciona</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, t: "1. Escolha o evento", d: "Pesquise por nome, cidade ou categoria." },
              { icon: CreditCard, t: "2. Pague com facilidade", d: "M-Pesa, e-Mola e, em breve, cartões." },
              { icon: QrCode, t: "3. Entre com o QR", d: "Receba o bilhete em PDF e mostre na entrada." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-electric/15 text-electric">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-sm">
            <p className="flex items-center gap-2 justify-center text-muted-foreground"><ShieldCheck className="h-4 w-4 text-gold" /> Bilhetes impossíveis de duplicar</p>
            <p className="flex items-center gap-2 justify-center text-muted-foreground"><Ticket className="h-4 w-4 text-gold" /> PDF e WhatsApp instantâneos</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-[image:var(--gradient-hero)] p-8 md:p-14">
          <Megaphone className="h-10 w-10 text-gold" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold max-w-xl">Organiza eventos? Venda connosco.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">Crie o seu evento, defina tipos de bilhete e acompanhe as vendas e o check-in em tempo real.</p>
          <Button asChild size="lg" className="mt-8 bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90">
            <Link to="/auth">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TicketGo. No coração dos grandes eventos.</p>
          <p>Feito com paixão em Moçambique 🇲🇿</p>
        </div>
      </footer>
    </main>
  );
}
