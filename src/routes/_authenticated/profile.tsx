import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Perfil — TicketGo" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => { setFullName(profile?.full_name ?? ""); setPhone(profile?.phone ?? ""); }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").upsert({ id: user!.id, full_name: fullName, phone });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <header className="mb-8 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-gold)] text-navy-deep">
          <User className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Meu perfil</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4 shadow-[var(--shadow-elegant)]">
        <div>
          <Label>Nome completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 bg-background border-border/60" />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+258 ..." className="mt-1 bg-background border-border/60" />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90">
          {save.isPending ? "A guardar…" : "Guardar alterações"}
        </Button>
      </div>
    </main>
  );
}