import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CustomFieldsManager from "@/components/CustomFieldsManager";

interface FormationData {
  id: string;
  titre: string;
  theme: string;
  date_debut: string;
  duree: string | null;
  lieu: string | null;
  formateur: string | null;
  places: number;
  statut: string;
  image_url: string | null;
  type: string;
}

const themes = ["Export", "Logistique", "Finance", "Marketing"];

const isEvent = (f: FormationData) => f.type === "evenement";

const EditSessionDialog = ({ formation }: { formation: FormationData }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titre: formation.titre,
    theme: formation.theme,
    date_debut: formation.date_debut,
    duree: formation.duree || "",
    lieu: formation.lieu || "",
    formateur: formation.formateur || "",
    places: formation.places,
    statut: formation.statut,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(formation.image_url);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
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
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let image_url: string | null | undefined = undefined;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("formations")
          .upload(fileName, imageFile, { contentType: imageFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("formations").getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      } else if (removeExistingImage) {
        image_url = null;
      }

      const updateData: Record<string, any> = {
        titre: form.titre,
        theme: form.theme,
        date_debut: form.date_debut,
        duree: form.duree || null,
        lieu: form.lieu || null,
        formateur: form.formateur || null,
        places: form.places,
        statut: form.statut,
      };
      if (image_url !== undefined) {
        updateData.image_url = image_url;
      }

      const { error } = await supabase.from("formations").update(updateData).eq("id", formation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Formation mise à jour !" });
      queryClient.invalidateQueries({ queryKey: ["formation-detail", formation.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-formations"] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.theme || !form.date_debut) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="w-4 h-4" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier {isEvent(formation) ? "l'événement" : "la formation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {isEvent(formation) ? "🎪 Événement" : "📚 Formation"}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input value={form.titre} onChange={(e) => update("titre", e.target.value)} placeholder={isEvent(formation) ? "Titre de l'événement" : "Titre de la formation"} />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Image de présentation</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
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
                list="edit-themes-list"
              />
              <datalist id="edit-themes-list">
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

          <div className={`grid ${isEvent(formation) ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={form.lieu} onChange={(e) => update("lieu", e.target.value)} placeholder="Ex: Abidjan, Agence CI Export" />
            </div>
            {!isEvent(formation) && (
              <div className="space-y-2">
                <Label>Formateur</Label>
                <Input value={form.formateur} onChange={(e) => update("formateur", e.target.value)} placeholder="Nom du formateur" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nombre de places</Label>
            <Input type="number" min={1} value={form.places} onChange={(e) => update("places", parseInt(e.target.value) || 30)} />
          </div>

          {!isEvent(formation) && (
            <>
              <hr className="border-border" />
              <CustomFieldsManager />
            </>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer les modifications
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionDialog;
