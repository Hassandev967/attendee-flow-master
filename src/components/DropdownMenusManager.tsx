import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, X, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DropdownMenu {
  id: string;
  name: string;
  options: string[];
}

const DropdownMenusManager = () => {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const { data: menus, isLoading } = useQuery({
    queryKey: ["dropdown-menus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dropdown_menus").select("*").order("name");
      if (error) throw error;
      return data as DropdownMenu[];
    },
  });

  const addMenu = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Le nom est requis");
      if (options.length < 2) throw new Error("Ajoutez au moins 2 options");
      const { error } = await supabase.from("dropdown_menus").insert({
        name: name.trim(),
        options,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-menus"] });
      resetForm();
      toast({ title: "Menu créé avec succès" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteMenu = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dropdown_menus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-menus"] });
      toast({ title: "Menu supprimé" });
    },
  });

  const resetForm = () => {
    setAdding(false);
    setName("");
    setOptions([]);
    setOptionInput("");
  };

  const addOption = () => {
    const val = optionInput.trim();
    if (val && !options.includes(val)) {
      setOptions([...options, val]);
      setOptionInput("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Menus déroulants réutilisables</h3>
          <p className="text-xs text-muted-foreground">
            Créez des listes d'options réutilisables dans vos formulaires.
          </p>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : menus && menus.length > 0 ? (
        <div className="space-y-2">
          {menus.map((menu) => (
            <div key={menu.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{menu.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Array.isArray(menu.options) ? (menu.options as string[]).join(", ") : ""}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs border-0">
                {Array.isArray(menu.options) ? menu.options.length : 0} options
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-8 w-8"
                onClick={() => deleteMenu.mutate(menu.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">Aucun menu créé.</p>
      )}

      {adding && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="space-y-1.5">
            <Label className="text-xs">Nom du menu *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pays" className="h-9 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Options</Label>
            <div className="flex gap-2">
              <Input
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Ajouter une option"
                className="h-9 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-9">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 text-xs">
                    {opt}
                    <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={resetForm}>Annuler</Button>
            <Button size="sm" onClick={() => addMenu.mutate()} disabled={addMenu.isPending}>
              {addMenu.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenusManager;
