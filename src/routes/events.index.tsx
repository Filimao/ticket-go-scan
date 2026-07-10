import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/event-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const eventsQuery = queryOptions({
  queryKey: ["events", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, slug, city, venue, category, image_url, starts_at, featured")
      .eq("status", "published")
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Todos os eventos — TicketGo" },
      { name: "description", content: "Pesquise concertos, conferências, galas e mais. Filtre por cidade, categoria e data." },
    ],
  }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(eventsQuery); },
  component: EventsPage,
  pendingComponent: EventsPending,
});

function EventsPending() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <header className="mb-10">
        <Skeleton className="h-10 md:h-12 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-40" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Skeleton className="aspect-[4/3] w-full rounded-none bg-muted" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function EventsPage() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const cities = useMemo(() => Array.from(new Set(events.map(e => e.city).filter(Boolean) as string[])), [events]);
  const categories = useMemo(() => Array.from(new Set(events.map(e => e.category).filter(Boolean) as string[])), [events]);

  const filtered = events.filter(e => {
    const match = q.trim() === "" || e.title.toLowerCase().includes(q.toLowerCase()) || (e.venue?.toLowerCase().includes(q.toLowerCase()) ?? false);
    const cityOk = city === "all" || e.city === city;
    const catOk = category === "all" || e.category === category;
    return match && cityOk && catOk;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <header className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Todos os eventos</h1>
        <p className="mt-2 text-muted-foreground">{events.length} eventos disponíveis</p>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] mb-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por nome ou local…" className="pl-9 bg-card border-border/60" />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="min-w-[160px] bg-card border-border/60"><SelectValue placeholder="Cidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="min-w-[160px] bg-card border-border/60"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
          Nenhum evento corresponde à sua pesquisa.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </main>
  );
}
