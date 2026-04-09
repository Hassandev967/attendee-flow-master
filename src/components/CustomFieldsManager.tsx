import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, GripVertical, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CustomField {
  id: string;
  label: string;
  field_type: string;
  options: string[];
  required: boolean;
  position: number;
  active: boolean;
}

const fieldTypeLabels: Record<string, string> = {
  text: "Texte",
  select: "Liste déroulante",
  checkbox: "Case à cocher",
  number: "Nombre",
};

const CustomFieldsManager = () => {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");

  const { data: fields, isLoading } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as CustomField[];
    },
  });

  const addField = useMutation({
    mutationFn: async () => {
      if (!newLabel.trim()) throw new Error("Le libellé est requis");
      if (newType === "select" && newOptions.length < 2) {
        throw new Error("Ajoutez au moins 2 options pour une liste déroulante");
      }
      const { error } = await supabase.from("custom_fields").insert({
        label: newLabel.trim(),
        field_type: newType,
        options: newType === "select" ? newOptions : [],
        required: newRequired,
        position: (fields?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      resetForm();
      toast({ title: "Champ ajouté avec succès" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("custom_fields").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
    },
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      toast({ title: "Champ supprimé" });
    },
  });

  const resetForm = () => {
    setAdding(false);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
    setNewOptions([]);
    setNewOptionInput("");
  };

  const addOption = () => {
    const val = newOptionInput.trim();
    if (val && !newOptions.includes(val)) {
      setNewOptions([...newOptions, val]);
      setNewOptionInput("");
    }
  };

  const removeOption = (idx: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Champs personnalisés</h3>
          <p className="text-xs text-muted-foreground">
            Ces champs seront ajoutés au formulaire d'inscription de toutes les formations.
          </p>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </Button>
        )}
      </div>

      {/* Existing fields */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : fields && fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{field.label}</span>
                  <Badge variant="secondary" className="text-xs border-0">
                    {fieldTypeLabels[field.field_type] || field.field_type}
                  </Badge>
                  {field.required && (
                    <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-0">
                      Requis
                    </Badge>
                  )}
                </div>
                {field.field_type === "select" && Array.isArray(field.options) && field.options.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Options : {(field.options as string[]).join(", ")}
                  </p>
                )}
                {field.field_type === "checkbox" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Options : Oui, Non
                  </p>
                )}
              </div>
              <Switch
                checked={field.active}
                onCheckedChange={(checked) => toggleActive.mutate({ id: field.id, active: checked })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-8 w-8"
                onClick={() => deleteField.mutate(field.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">
          Aucun champ personnalisé configuré.
        </p>
      )}

      {/* Add field form */}
      {adding && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Libellé *</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Poste occupé"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="select">Liste déroulante</SelectItem>
                  <SelectItem value="checkbox">Case à cocher</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {newType === "select" && (
            <div className="space-y-2">
              <Label className="text-xs">Options de la liste</Label>
              <div className="flex gap-2">
                <Input
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  placeholder="Ajouter une option"
                  className="h-9 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-9">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {newOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {newOptions.map((opt, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 text-xs">
                      {opt}
                      <button type="button" onClick={() => removeOption(idx)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {newType === "checkbox" && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">Aperçu : l'utilisateur verra les options suivantes</p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">☑ Oui</span>
                <span className="text-sm font-medium">☐ Non</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={newRequired} onCheckedChange={setNewRequired} />
            <Label className="text-xs">Champ obligatoire</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Annuler
            </Button>
            <Button size="sm" onClick={() => addField.mutate()} disabled={addField.isPending}>
              {addField.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsManager;
