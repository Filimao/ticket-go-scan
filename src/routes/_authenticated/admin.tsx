import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { ready, isAdmin } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-16 text-center text-muted-foreground">A carregar…</div></div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-background"><SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Acesso restrito</h1>
        <p className="mt-3 text-muted-foreground">Esta área é exclusiva de administradores.</p>
      </div>
    </div>
  );

  const tabs = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/events", label: "Eventos" },
    { to: "/admin/users", label: "Utilizadores" },
    { to: "/admin/settings", label: "Comissão" },
    { to: "/admin/logs", label: "Logs" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-gold uppercase">Administração</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">TicketGo Admin</h1>
        </div>
        <nav className="flex flex-wrap gap-2 mb-6 border-b border-border/60 pb-3">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === t.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              {t.label}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}