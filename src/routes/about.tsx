import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoCard, meta } from "@/components/info-page";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: meta("Sobre nós — TicketGo", "Conheça a TicketGo, a bilheteira digital moçambicana para concertos, festas e conferências.") }),
  component: () => (
    <InfoPage eyebrow="Sobre nós" title="A bilheteira dos grandes eventos" intro="A TicketGo liga o público aos melhores eventos de Moçambique, com compra simples e entrada rápida por QR Code.">
      <InfoCard title="A nossa missão">Acabar com as filas e a fraude de bilhetes, dando a organizadores e ao público uma experiência segura e moderna.</InfoCard>
      <InfoCard title="Para o público">Encontre eventos, pague com M-Pesa ou e-Mola e receba o seu bilhete em PDF e no WhatsApp.</InfoCard>
      <InfoCard title="Para organizadores">Crie eventos, defina tipos de bilhete (VIP, Normal, Early Bird), acompanhe vendas e faça o check-in com o scanner.</InfoCard>
    </InfoPage>
  ),
});
