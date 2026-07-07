import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { formatCurrency, formatEventDate, formatEventTime } from "./format";

export interface TicketPdfData {
  id: string;
  qrCode: string;
  eventTitle: string;
  eventDate: string;
  venue: string | null;
  city: string | null;
  ticketTypeName: string;
  buyerName: string;
  pricePaid: number;
  currency: string;
}

export async function downloadTicketPdf(t: TicketPdfData) {
  const qrDataUrl = await QRCode.toDataURL(t.qrCode, { errorCorrectionLevel: "H", margin: 1, width: 512 });
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // Navy header
  doc.setFillColor(17, 24, 51);
  doc.rect(0, 0, w, 130, "F");
  doc.setTextColor(230, 190, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("TicketGo", 40, 60);
  doc.setFontSize(11);
  doc.setTextColor(220, 220, 220);
  doc.setFont("helvetica", "normal");
  doc.text("Bilhete digital oficial", 40, 82);
  doc.text(`ID: ${t.id.slice(0, 8).toUpperCase()}`, 40, 100);

  // Body
  doc.setTextColor(20, 20, 30);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(t.eventTitle, 40, 180, { maxWidth: w - 80 });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 90);
  const info: [string, string][] = [
    ["Data", `${formatEventDate(t.eventDate)} • ${formatEventTime(t.eventDate)}`],
    ["Local", `${t.venue ?? ""}${t.city ? ", " + t.city : ""}`],
    ["Categoria", t.ticketTypeName],
    ["Comprador", t.buyerName],
    ["Valor pago", formatCurrency(t.pricePaid, t.currency)],
  ];
  let y = 230;
  info.forEach(([k, v]) => {
    doc.setTextColor(140, 140, 150);
    doc.text(k.toUpperCase(), 40, y);
    doc.setTextColor(20, 20, 30);
    doc.setFont("helvetica", "bold");
    doc.text(v, 40, y + 16, { maxWidth: 300 });
    doc.setFont("helvetica", "normal");
    y += 44;
  });

  // QR
  doc.addImage(qrDataUrl, "PNG", w - 220, 180, 180, 180);
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 150);
  doc.text("Apresente este QR na entrada", w - 220, 380);

  // Footer
  doc.setDrawColor(230, 190, 90);
  doc.setLineWidth(1);
  doc.line(40, y + 20, w - 40, y + 20);
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 150);
  doc.text("TicketGo © — bilhete único e intransmissível. Válido apenas quando o código QR é verificado à entrada.", 40, y + 40, { maxWidth: w - 80 });

  doc.save(`ticketgo-${t.id.slice(0, 8)}.pdf`);
}