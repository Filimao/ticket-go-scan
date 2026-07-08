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
