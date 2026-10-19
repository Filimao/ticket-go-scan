import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoCard, meta } from "@/components/info-page";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: meta("Termos e reembolsos — TicketGo", "Condições de compra, uso e reembolso dos bilhetes TicketGo.") }),
  component: () => (
    <InfoPage eyebrow="Legal" title="Termos e reembolsos" intro="Condições gerais de utilização da plataforma TicketGo.">
      <InfoCard title="Compra">O bilhete só é válido após confirmação do pagamento. Cada bilhete dá direito a uma entrada.</InfoCard>
      <InfoCard title="Uso do QR Code">Não partilhe o seu QR Code. A primeira leitura na entrada invalida reutilizações.</InfoCard>
      <InfoCard title="Cancelamento de eventos">Se um evento for cancelado pelo organizador, o valor será reembolsado pelo mesmo método de pagamento.</InfoCard>
      <InfoCard title="Reembolsos">Fora de cancelamentos, os reembolsos dependem da política de cada organizador.</InfoCard>
    </InfoPage>
  ),
});
