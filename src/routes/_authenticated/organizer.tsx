import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useRoles } from "@/hooks/use-roles";
import { LayoutDashboard, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/organizer")({
  component: OrganizerLayout,
});

function OrganizerLayout() {
  const { ready, isOrganizer } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-16 text-muted-foreground">A carregar…</div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Área de Organizadores</h1>
          <p className="mt-3 text-muted-foreground">
            A tua conta ainda não tem permissões de organizador. Contacta um administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gold uppercase">Painel</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Organizador</h1>
          </div>
          <nav className="flex gap-2 text-sm">
            <Link
              to="/organizer"
              className={`px-4 py-2 rounded-lg border transition ${pathname === "/organizer" ? "bg-primary text-primary-foreground border-transparent" : "border-border/60 hover:bg-muted"}`}
            >
              <LayoutDashboard className="h-4 w-4 inline mr-2" />Dashboard
            </Link>
            <Link
              to="/organizer/events/new"
              className="px-4 py-2 rounded-lg bg-[image:var(--gradient-gold)] text-navy-deep font-semibold"
            >
              <PlusCircle className="h-4 w-4 inline mr-2" />Novo evento
            </Link>
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}