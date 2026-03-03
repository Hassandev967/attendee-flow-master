import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type SessionMode = Database["public"]["Enums"]["session_mode"];
type SessionStatut = Database["public"]["Enums"]["session_statut"];

interface SessionFormData {
  titre: string;
  thematique: string;
  description: string;
  date_session: string;
  horaire: string;
  lieu: string;
  mode: SessionMode;
  places: number;
  statut: SessionStatut;
  lien_visio: string;
}

const defaultForm: SessionFormData = {
  titre: "",
  thematique: "",
  description: "",
  date_session: "",
  horaire: "",
  lieu: "",
  mode: "presentiel",
  places: 30,
  statut: "brouillon",
  lien_visio: "",
};

const CreateSessionDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SessionFormData>(defaultForm);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      const { error } = await supabase.from("sessions").insert({
        titre: data.titre,
        thematique: data.thematique,
        description: data.description || null,
        date_session: new Date(data.date_session).toISOString(),
        horaire: data.horaire,
        lieu: data.lieu,
        mode: data.mode,
        places: data.places,
        statut: data.statut,
        lien_visio: data.lien_visio || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Session créée !" });
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      setForm(defaultForm);
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: keyof SessionFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.thematique || !form.date_session || !form.horaire || !form.lieu) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input value={form.titre} onChange={(e) => update("titre", e.target.value)} placeholder="Titre de la session" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thématique *</Label>
              <Input value={form.thematique} onChange={(e) => update("thematique", e.target.value)} placeholder="Ex: Commerce international" />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => update("statut", v as SessionStatut)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="publiee">Publiée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Description de la session..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="datetime-local" value={form.date_session} onChange={(e) => update("date_session", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horaire affiché *</Label>
              <Input value={form.horaire} onChange={(e) => update("horaire", e.target.value)} placeholder="Ex: 09h00 - 12h00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lieu *</Label>
              <Input value={form.lieu} onChange={(e) => update("lieu", e.target.value)} placeholder="Ex: Casablanca, CCI" />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={form.mode} onValueChange={(v) => update("mode", v as SessionMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentiel">Présentiel</SelectItem>
                  <SelectItem value="en_ligne">En ligne</SelectItem>
                  <SelectItem value="hybride">Hybride</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de places</Label>
              <Input type="number" min={1} value={form.places} onChange={(e) => update("places", parseInt(e.target.value) || 30)} />
            </div>
            <div className="space-y-2">
              <Label>Lien visio</Label>
              <Input value={form.lien_visio} onChange={(e) => update("lien_visio", e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Créer la session
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionDialog;
