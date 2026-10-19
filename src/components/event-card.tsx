import { Link } from "@tanstack/react-router";
import { MapPin, Calendar } from "lucide-react";
import { formatEventShortDate, formatEventTime } from "@/lib/format";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string | null;
    city: string | null;
    venue: string | null;
    category: string | null;
    image_url: string | null;
    starts_at: string;
    featured?: boolean;
  };
}

export function EventCard({ event }: EventCardProps) {
  const short = formatEventShortDate(event.starts_at);
  return (
    <Link
      to="/events/$id"
      params={{ id: event.id }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-gold/50 hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent" />
        <div className="absolute left-4 top-4 grid place-items-center rounded-xl bg-background/90 backdrop-blur px-3 py-2 text-center shadow-lg">
          <div className="text-lg font-bold leading-none font-display text-gold">{short.day}</div>
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground">{short.month}</div>
        </div>
        {event.category && (
          <span className="absolute right-4 top-4 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-navy-deep">
            {event.category}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold leading-tight line-clamp-2 group-hover:text-gold transition-colors">
          {event.title}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {formatEventTime(event.starts_at)}</p>
          {(event.venue || event.city) && (
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {[event.venue, event.city].filter(Boolean).join(", ")}</p>
          )}
        </div>
      </div>
    </Link>
  );
}