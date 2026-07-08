import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/scan")({
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-6"><Outlet /></div>
    </div>
  ),
});
*** Add File: src/routes/_authenticated/scan.index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatEventDate } from "@/lib/format";
import { ScanLine } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scan/")({
  component: ScanIndex,
});

function ScanIndex() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["scanner-events", user?.id],
    queryFn: async () => {
      // Events I organize
      const own = await supabase.from("events").select("id, title, starts_at, city, venue").eq("organizer_id", user!.id);
      // Events I'm staff for
      const staff = await supabase.from("event_staff").select("event_id, events(id, title, starts_at, city, venue)").eq("user_id", user!.id);
      const map = new Map<string, { id: string; title: string; starts_at: string; city: string | null; venue: string | null }>();
      (own.data ?? []).forEach((e) => map.set(e.id, e));
      (staff.data ?? []).forEach((s) => { if (s.events) map.set(s.events.id, s.events); });
      return Array.from(map.values()).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    },
  });

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-gold uppercase">Check-in</p>
        <h1 className="font-display text-3xl font-bold mt-1">Scanner de bilhetes</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolhe o evento para iniciar a validação.</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">A carregar…</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-muted-foreground">Ainda não tens eventos atribuídos.</p>
      ) : (
        <div className="grid gap-3">
          {(data ?? []).map((e) => (
            <Link key={e.id} to="/scan/$eventId" params={{ eventId: e.id }} className="rounded-2xl border border-border/60 bg-card p-5 flex items-center justify-between hover:border-gold/60 transition">
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-sm text-muted-foreground">{formatEventDate(e.starts_at)} • {e.venue ?? "—"}, {e.city ?? "—"}</p>
              </div>
              <ScanLine className="h-5 w-5 text-gold" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}