import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export interface EventInitial {
  id?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  venue?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  image_url?: string | null;
  status?: string;
}

export function EventForm({ initial, onSaved }: { initial?: EventInitial; onSaved: (id: string) => void }) {
  const { user } = useSession();
  const [form, setForm] = useState<EventInitial>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    city: initial?.city ?? "",
    venue: initial?.venue ?? "",
    starts_at: initial?.starts_at ? initial.starts_at.slice(0, 16) : "",
    ends_at: initial?.ends_at ? initial.ends_at.slice(0, 16) : "",
    image_url: initial?.image_url ?? "",
    status: initial?.status ?? "draft",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof EventInitial>(k: K, v: EventInitial[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("event-images").getPublicUrl(path);
      update("image_url", data.publicUrl);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.starts_at) {
      toast.error("Título e data são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title!,
        description: form.description || null,
        category: form.category || null,
        city: form.city || null,
        venue: form.venue || null,
        starts_at: new Date(form.starts_at!).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        image_url: form.image_url || null,
        status: (form.status ?? "draft") as "draft" | "published" | "cancelled" | "pending" | "rejected" | "ended",
        organizer_id: user.id,
      };
      if (initial?.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Evento atualizado");
        onSaved(initial.id);
      } else {
        const { data, error } = await supabase.from("events").insert(payload).select("id").single();
        if (error) throw error;
        toast.success("Evento criado");
        onSaved(data.id);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border/60 bg-card p-6">
      <div>
        <Label>Título *</Label>
        <Input value={form.title ?? ""} onChange={(e) => update("title", e.target.value)} required />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea rows={4} value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Categoria</Label><Input value={form.category ?? ""} onChange={(e) => update("category", e.target.value)} placeholder="Música, Desporto…" /></div>
        <div><Label>Cidade</Label><Input value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} placeholder="Maputo" /></div>
        <div className="md:col-span-2"><Label>Local</Label><Input value={form.venue ?? ""} onChange={(e) => update("venue", e.target.value)} placeholder="Centro Cultural…" /></div>
        <div><Label>Início *</Label><Input type="datetime-local" value={form.starts_at ?? ""} onChange={(e) => update("starts_at", e.target.value)} required /></div>
        <div><Label>Fim</Label><Input type="datetime-local" value={form.ends_at ?? ""} onChange={(e) => update("ends_at", e.target.value)} /></div>
      </div>
      <div>
        <Label>Imagem de capa</Label>
        <div className="flex items-center gap-3 mt-1">
          {form.image_url && <img src={form.image_url} alt="capa" className="h-16 w-24 rounded-lg object-cover" />}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted text-sm">
            <Upload className="h-4 w-4" />
            {uploading ? "A enviar…" : "Enviar imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          </label>
        </div>
      </div>
      <div>
        <Label>Estado</Label>
        <Select value={form.status} onValueChange={(v) => update("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="pending">Aguarda aprovação</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="ended">Encerrado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={saving} className="bg-[image:var(--gradient-gold)] text-navy-deep font-semibold hover:opacity-90">
        {saving ? "A guardar…" : initial?.id ? "Guardar alterações" : "Criar evento"}
      </Button>
    </form>
  );
}