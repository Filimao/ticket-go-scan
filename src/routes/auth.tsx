import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — TicketGo" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/" });
    });
  }, [router]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Bem-vindo de volta!"); router.navigate({ to: "/" }); }
  };

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Conta criada! Já pode entrar."); }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Erro Google: " + error.message);
  };

  const reset = async () => {
    if (!email) return toast.error("Introduza o email primeiro.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) toast.error(error.message);
    else toast.success("Email de recuperação enviado.");
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-gold)] shadow-[var(--shadow-gold)]">
            <Ticket className="h-7 w-7 text-navy-deep" />
          </div>
          <h1 className="font-display text-3xl font-bold">Bem-vindo ao <span className="text-gold">TicketGo</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Aceda ou crie a sua conta para comprar bilhetes.</p>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-elegant)]">
          <Button onClick={google} variant="outline" className="w-full border-border/60 h-11 gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3-3C17.2 1.7 14.7.5 12 .5 7.4.5 3.4 3 1.4 7l3.5 2.7C5.9 6.7 8.7 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.5 2.7c2-1.9 3.9-4.7 3.9-8.4z"/><path fill="#FBBC05" d="M4.9 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.4 7c-.9 1.7-1.4 3.6-1.4 5.6s.5 3.9 1.4 5.6l3.5-3z"/><path fill="#34A853" d="M12 23.5c3.2 0 5.9-1.1 7.9-2.9l-3.5-2.7c-1 .7-2.3 1.1-4.4 1.1-3.3 0-6.1-1.7-7.1-4.7L1.4 17c2 4 6 6.5 10.6 6.5z"/></svg>
            Continuar com Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" /> OU <div className="h-px flex-1 bg-border/60" />
          </div>

          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2 bg-background">
              <TabsTrigger value="in">Entrar</TabsTrigger>
              <TabsTrigger value="up">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="in" className="space-y-3 pt-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-background border-border/60" /></div>
              <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-background border-border/60" /></div>
              <Button onClick={signIn} disabled={loading} className="w-full bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90 h-11">
                {loading ? "A entrar…" : "Entrar"}
              </Button>
              <button onClick={reset} className="w-full text-xs text-muted-foreground hover:text-gold text-center">Esqueci-me da palavra-passe</button>
            </TabsContent>
            <TabsContent value="up" className="space-y-3 pt-4">
              <div><Label>Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-background border-border/60" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-background border-border/60" /></div>
              <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-background border-border/60" /></div>
              <Button onClick={signUp} disabled={loading} className="w-full bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90 h-11">
                {loading ? "A criar…" : "Criar conta"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
