import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoCard, meta } from "@/components/info-page";

const faqs = [
  ["Como compro um bilhete?", "Escolha o evento, selecione o tipo e a quantidade, e siga as instruções de pagamento M-Pesa ou e-Mola."],
  ["Quando recebo o bilhete?", "Assim que o pagamento é confirmado, o bilhete fica em \"Meus bilhetes\", com QR Code e PDF para descarregar."],
  ["Posso enviar o bilhete pelo WhatsApp?", "Sim. Indique o seu número na compra e use o botão WhatsApp no bilhete."],
  ["O QR Code pode ser usado duas vezes?", "Não. Cada QR é único e fica marcado como utilizado na primeira entrada."],
  ["Perdi o meu telemóvel, e agora?", "Entre na sua conta noutro dispositivo e volte a descarregar o bilhete."],
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: meta("Perguntas frequentes — TicketGo", "Respostas sobre compra, pagamento, entrega e uso dos bilhetes TicketGo.") }),
  component: () => (
    <InfoPage eyebrow="Ajuda" title="Perguntas frequentes" intro="Tudo o que precisa de saber antes e depois de comprar.">
      {faqs.map(([q, a]) => <InfoCard key={q} title={q}>{a}</InfoCard>)}
    </InfoPage>
  ),
});
