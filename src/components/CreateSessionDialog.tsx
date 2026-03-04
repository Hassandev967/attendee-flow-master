import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FormationFormData {
  titre: string;
  theme: string;
  date_debut: string;
  duree: string;
  lieu: string;
  formateur: string;
  places: number;
  statut: string;
}

const defaultForm: FormationFormData = {
  titre: "",
  theme: "Export",
  date_debut: "",
  duree: "",
  lieu: "",
  formateur: "",
  places: 30,
  statut: "A venir",
};

const themes = ["Export", "Logistique", "Finance", "Marketing"];

const CreateSessionDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormationFormData>(defaultForm);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: FormationFormData) => {
      const { error } = await supabase.from("formations").insert({
        titre: data.titre,
        theme: data.theme,
        date_debut: data.date_debut,
        duree: data.duree || null,
        lieu: data.lieu || null,
        formateur: data.formateur || null,
        places: data.places,
        statut: data.statut,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Formation créée !" });
      queryClient.invalidateQueries({ queryKey: ["admin-formations"] });
      setForm(defaultForm);
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: keyof FormationFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.theme || !form.date_debut) {
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
          Nouvelle formation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une formation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input value={form.titre} onChange={(e) => update("titre", e.target.value)} placeholder="Titre de la formation" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thème *</Label>
              <Select value={form.theme} onValueChange={(v) => update("theme", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => update("statut", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A venir">À venir</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Terminée">Terminée</SelectItem>
                  <SelectItem value="Annulée">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Input type="date" value={form.date_debut} onChange={(e) => update("date_debut", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Durée</Label>
              <Input value={form.duree} onChange={(e) => update("duree", e.target.value)} placeholder="Ex: 2 jours" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={form.lieu} onChange={(e) => update("lieu", e.target.value)} placeholder="Ex: Abidjan, ACIEX" />
            </div>
            <div className="space-y-2">
              <Label>Formateur</Label>
              <Input value={form.formateur} onChange={(e) => update("formateur", e.target.value)} placeholder="Nom du formateur" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre de places</Label>
            <Input type="number" min={1} value={form.places} onChange={(e) => update("places", parseInt(e.target.value) || 30)} />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Créer la formation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionDialog;
