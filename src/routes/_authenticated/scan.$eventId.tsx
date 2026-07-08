import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkinTicket, type CheckinResult } from "@/lib/checkin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scan/$eventId")({
  component: Scanner,
});

function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  } catch { /* no-op */ }
}

function Scanner() {
  const { eventId } = Route.useParams();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState<Array<CheckinResult & { at: string }>>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastQrRef = useRef<{ qr: string; at: number } | null>(null);

  const eventQ = useQuery({
    queryKey: ["scanner-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, title, city, venue").eq("id", eventId).single();
      if (error) throw error;
      return data;
    },
  });

  const handle = async (qr: string) => {
    const now = Date.now();
    if (lastQrRef.current && lastQrRef.current.qr === qr && now - lastQrRef.current.at < 3000) return;
    lastQrRef.current = { qr, at: now };
    const res = await checkinTicket(qr, eventId);
    setResult(res);
    setHistory((h) => [{ ...res, at: new Date().toLocaleTimeString("pt-PT") }, ...h].slice(0, 20));
    beep(res.ok);
    if (navigator.vibrate) navigator.vibrate(res.ok ? 60 : [80, 40, 80]);
  };

  const start = async () => {
    if (scannerRef.current) return;
    setScanning(true);
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => { void handle(decoded); },
        () => { /* ignore scan errors */ },
      );
    } catch (e) {
      setScanning(false);
      alert("Não foi possível abrir a câmara: " + (e as Error).message);
    }
  };

  const stop = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); await scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => { void stop(); }, []);

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manual.trim()) { await handle(manual.trim()); setManual(""); }
  };

  return (
    <div>
      <Link to="/scan" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" />Voltar</Link>
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest text-gold uppercase">Scanner</p>
        <h1 className="font-display text-2xl font-bold">{eventQ.data?.title ?? "…"}</h1>
        <p className="text-sm text-muted-foreground">{eventQ.data?.venue ?? ""}{eventQ.data?.city ? ", " + eventQ.data.city : ""}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div id="qr-reader" className="w-full aspect-square bg-black/40 rounded-xl overflow-hidden grid place-items-center text-muted-foreground text-sm">
            {!scanning && "Câmara desativada"}
          </div>
          <div className="flex gap-2 mt-3">
            {!scanning ? (
              <Button onClick={start} className="flex-1 bg-[image:var(--gradient-gold)] text-navy-deep font-semibold">Iniciar câmara</Button>
            ) : (
              <Button onClick={stop} variant="outline" className="flex-1">Parar</Button>
            )}
          </div>
          <form onSubmit={submitManual} className="flex gap-2 mt-3">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Introduzir código manualmente" />
            <Button type="submit" variant="outline">Validar</Button>
          </form>
        </div>

        <div className="space-y-4">
          {result && (
            <div className={`rounded-2xl border p-6 ${result.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
              <div className="flex items-center gap-3">
                {result.ok ? <CheckCircle2 className="h-10 w-10 text-emerald-400" /> : <XCircle className="h-10 w-10 text-red-400" />}
                <div>
                  <p className={`font-display text-xl font-bold ${result.ok ? "text-emerald-300" : "text-red-300"}`}>{result.message}</p>
                  {result.ticket && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {result.ticket.buyer_name && <p>{result.ticket.buyer_name}</p>}
                      {result.ticket.ticket_type && <p>{result.ticket.ticket_type}</p>}
                      {result.ticket.checked_in_at && <p>Validado às {new Date(result.ticket.checked_in_at).toLocaleTimeString("pt-PT")}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="font-semibold mb-3">Histórico da sessão</h3>
            {history.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma validação ainda.</p>}
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                  <span className={h.ok ? "text-emerald-400" : "text-red-400"}>
                    {h.ok ? "✓" : "✗"} {h.ticket?.buyer_name ?? h.message}
                  </span>
                  <span className="text-xs text-muted-foreground">{h.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}