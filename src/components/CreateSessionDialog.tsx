import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, ImagePlus, X } from "lucide-react";
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
  theme: "",
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image trop volumineuse", description: "Max 5 Mo", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormationFormData) => {
      let image_url: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("formations")
          .upload(fileName, imageFile, { contentType: imageFile.type });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("formations")
          .getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("formations").insert({
        titre: data.titre,
        theme: data.theme,
        date_debut: data.date_debut,
        duree: data.duree || null,
        lieu: data.lieu || null,
        formateur: data.formateur || null,
        places: data.places,
        statut: data.statut,
        image_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Formation créée !" });
      queryClient.invalidateQueries({ queryKey: ["admin-formations"] });
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview(null);
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

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Image de présentation</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 hover:bg-muted/30 transition-colors">
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Cliquez pour ajouter une image</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG — Max 5 Mo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thème *</Label>
              <Input
                value={form.theme}
                onChange={(e) => update("theme", e.target.value)}
                placeholder="Ex: Export, Logistique, Finance..."
                list="themes-list"
              />
              <datalist id="themes-list">
                {themes.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
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
              <Input value={form.lieu} onChange={(e) => update("lieu", e.target.value)} placeholder="Ex: Abidjan, Agence CI Export" />
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
