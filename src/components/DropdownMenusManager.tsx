import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, X, ChevronDown, FileText, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MenuOption {
  label: string;
  form_slug?: string;
}

interface DropdownMenu {
  id: string;
  name: string;
  options: MenuOption[];
}

interface DynamicForm {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
}

// Helper to normalize legacy string[] options to MenuOption[]
const normalizeOptions = (raw: any): MenuOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) =>
    typeof item === "string" ? { label: item } : item
  );
};

const DropdownMenusManager = () => {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [optionFormSlug, setOptionFormSlug] = useState<string>("");

  const { data: menus, isLoading } = useQuery({
    queryKey: ["dropdown-menus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dropdown_menus").select("*").order("name");
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        ...m,
        options: normalizeOptions(m.options),
      })) as DropdownMenu[];
    },
  });

  const { data: forms } = useQuery({
    queryKey: ["all-dynamic-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_forms")
        .select("id, title, slug, is_active")
        .order("title");
      if (error) throw error;
      return data as DynamicForm[];
    },
  });

  const addMenu = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Le nom est requis");
      if (options.length < 1) throw new Error("Ajoutez au moins 1 option");
      const { error } = await supabase.from("dropdown_menus").insert({
        name: name.trim(),
        options: options as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-menus"] });
      queryClient.invalidateQueries({ queryKey: ["public-dropdown-menus"] });
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
      queryClient.invalidateQueries({ queryKey: ["public-dropdown-menus"] });
      toast({ title: "Menu supprimé" });
    },
  });

  const resetForm = () => {
    setAdding(false);
    setName("");
    setOptions([]);
    setOptionInput("");
    setOptionFormSlug("");
  };

  const addOption = () => {
    const val = optionInput.trim();
    if (val && !options.some((o) => o.label === val)) {
      setOptions([
        ...options,
        { label: val, form_slug: optionFormSlug || undefined },
      ]);
      setOptionInput("");
      setOptionFormSlug("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Menus déroulants réutilisables</h3>
          <p className="text-xs text-muted-foreground">
            Créez des menus avec des options pouvant pointer vers des formulaires.
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
            <div key={menu.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                <span className="text-sm font-medium text-foreground flex-1">{menu.name}</span>
                <Badge variant="secondary" className="text-xs border-0">
                  {menu.options.length} options
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
              <div className="pl-7 space-y-1">
                {menu.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{opt.label}</span>
                    {opt.form_slug && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-accent/30 text-accent">
                        <Link2 className="w-2.5 h-2.5" />
                        {opt.form_slug}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nos services" className="h-9 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Options</Label>
            <div className="flex gap-2">
              <Input
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Nom de l'option"
                className="h-9 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addOption(); }
                }}
              />
              <Select value={optionFormSlug} onValueChange={setOptionFormSlug}>
                <SelectTrigger className="h-9 text-xs w-[180px]">
                  <SelectValue placeholder="Lier un formulaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun formulaire</SelectItem>
                  {forms?.map((f) => (
                    <SelectItem key={f.id} value={f.slug}>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        {f.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-9">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 text-xs">
                    {opt.label}
                    {opt.form_slug && (
                      <span className="text-accent text-[10px]">→ {opt.form_slug}</span>
                    )}
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
