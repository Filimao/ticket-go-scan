import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoCard, meta } from "@/components/info-page";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: meta("Contacto — TicketGo", "Fale com a equipa TicketGo por telefone ou WhatsApp.") }),
  component: () => (
    <InfoPage eyebrow="Contacto" title="Fale connosco" intro="Estamos aqui para ajudar com compras, pagamentos e eventos.">
      <InfoCard title="Telefone / WhatsApp">
        850113678 / 866955676 —{" "}
        <a href="https://wa.me/258850113678" target="_blank" rel="noreferrer" className="text-gold underline">abrir WhatsApp</a>
      </InfoCard>
      <InfoCard title="Horário">Segunda a sábado, das 08h às 18h.</InfoCard>
      <InfoCard title="Localização">Maputo, Moçambique.</InfoCard>
    </InfoPage>
  ),
});
