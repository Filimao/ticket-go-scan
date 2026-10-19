import { Link } from "@tanstack/react-router";
import { Ticket, Phone, MapPin, Clock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border/60 bg-card/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-gold)] text-navy-deep"><Ticket className="h-5 w-5" /></div>
            <span className="font-display text-xl font-bold">Ticket<span className="text-gold">Go</span></span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">No coração dos grandes eventos. Bilheteira digital 100% moçambicana.</p>
        </div>
        <div>
          <h4 className="font-semibold">Explorar</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/events" className="hover:text-gold">Eventos</Link></li>
            <li><Link to="/about" className="hover:text-gold">Sobre nós</Link></li>
            <li><Link to="/auth" className="hover:text-gold">Vender bilhetes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Ajuda</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faq" className="hover:text-gold">Perguntas frequentes</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contacto</Link></li>
            <li><Link to="/terms" className="hover:text-gold">Termos e reembolsos</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Contacto</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><Phone className="h-4 w-4 text-gold" /> 850113678 / 866955676</li>
            <li className="flex gap-2"><MapPin className="h-4 w-4 text-gold" /> Maputo, Moçambique</li>
            <li className="flex gap-2"><Clock className="h-4 w-4 text-gold" /> Seg–Sáb, 08h–18h</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Pagamentos: M-Pesa • e-Mola</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TicketGo. Feito com paixão em Moçambique 🇲🇿
      </div>
    </footer>
  );
}
