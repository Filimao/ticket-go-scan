import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold">{title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
      <div className="mt-12 space-y-6">{children}</div>
    </main>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="font-display text-xl font-bold text-gold">{title}</h2>
      <div className="mt-2 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export const meta = (title: string, description: string) => [
  { title },
  { name: "description", content: description },
  { property: "og:title", content: title },
  { property: "og:description", content: description },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
];
