import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  options: string[];
  required: boolean;
  position: number;
  width: string;
}

const FIELD_TYPES: Record<string, string> = {
  text: "Texte court",
  textarea: "Texte long",
  email: "Email",
  tel: "Téléphone",
  number: "Nombre",
  date: "Date",
  select: "Liste déroulante",
  dropdown_menu: "Menu déroulant (réutilisable)",
  checkbox: "Case à cocher",
  radio: "Choix unique (radio)",
  file: "Fichier",
  heading: "Titre de section",
  separator: "Séparateur",
};

const WIDTH_OPTIONS: Record<string, string> = {
  full: "Pleine largeur",
  half: "Demi-largeur",
  third: "Tiers",
};

const FormFieldsEditor = () => {
  const { id: formId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [placeholder, setPlaceholder] = useState("");
  const [required, setRequired] = useState(false);
  const [width, setWidth] = useState("full");
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [selectedDropdown, setSelectedDropdown] = useState("");

  const { data: form } = useQuery({
    queryKey: ["dynamic-form", formId],
    queryFn: async () => {
      const { data, error } = await supabase.from("dynamic_forms").select("*").eq("id", formId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const { data: fields, isLoading } = useQuery({
    queryKey: ["dynamic-form-fields", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_form_fields")
        .select("*")
        .eq("form_id", formId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as FormField[];
    },
    enabled: !!formId,
  });

  const { data: dropdownMenus } = useQuery({
    queryKey: ["dropdown-menus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dropdown_menus").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
    initialData: [],
  });

  const addField = useMutation({
    mutationFn: async () => {
      if (!label.trim()) throw new Error("Le libellé est requis");
      const fieldOptions = fieldType === "dropdown_menu" && selectedDropdown
        ? dropdownMenus?.find(d => d.id === selectedDropdown)?.options || []
        : options;

      const { error } = await supabase.from("dynamic_form_fields").insert({
        form_id: formId,
        label: label.trim(),
        field_type: fieldType === "dropdown_menu" ? "select" : fieldType,
        placeholder: placeholder.trim() || null,
        options: ["select", "radio", "dropdown_menu"].includes(fieldType) ? fieldOptions : [],
        required,
        width,
        position: (fields?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-form-fields", formId] });
      resetForm();
      toast({ title: "Champ ajouté" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const updateField = useMutation({
    mutationFn: async () => {
      if (!editingField) return;
      const fieldOptions = fieldType === "dropdown_menu" && selectedDropdown
        ? dropdownMenus?.find(d => d.id === selectedDropdown)?.options || []
        : options;

      const { error } = await supabase.from("dynamic_form_fields").update({
        label: label.trim(),
        field_type: fieldType === "dropdown_menu" ? "select" : fieldType,
        placeholder: placeholder.trim() || null,
        options: ["select", "radio", "dropdown_menu"].includes(fieldType) ? fieldOptions : [],
        required,
        width,
      }).eq("id", editingField.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-form-fields", formId] });
      resetForm();
      toast({ title: "Champ modifié" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dynamic_form_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-form-fields", formId] });
      toast({ title: "Champ supprimé" });
    },
  });

  const resetForm = () => {
    setShowAdd(false);
    setEditingField(null);
    setLabel("");
    setFieldType("text");
    setPlaceholder("");
    setRequired(false);
    setWidth("full");
    setOptions([]);
    setOptionInput("");
    setSelectedDropdown("");
  };

  const startEdit = (field: FormField) => {
    setEditingField(field);
    setLabel(field.label);
    setFieldType(field.field_type);
    setPlaceholder(field.placeholder || "");
    setRequired(field.required);
    setWidth(field.width);
    setOptions(Array.isArray(field.options) ? field.options as string[] : []);
    setShowAdd(true);
  };

  const addOption = () => {
    const val = optionInput.trim();
    if (val && !options.includes(val)) {
      setOptions([...options, val]);
      setOptionInput("");
    }
  };

  const isDialogOpen = showAdd || !!editingField;
  const needsOptions = ["select", "radio", "dropdown_menu"].includes(fieldType);

  return (
    <AdminLayout
      title={form?.title || "Champs du formulaire"}
      subtitle={form?.description || "Configurez les champs de votre formulaire"}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/admin/formulaires")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`/formulaire/${form?.slug}`, "_blank")} className="gap-2">
              <Eye className="w-4 h-4" /> Aperçu
            </Button>
            <Button onClick={() => setShowAdd(true)} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4" /> Ajouter un champ
            </Button>
          </div>
        </div>

        {/* Fields list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : fields && fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className="stat-card flex items-center gap-3 cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all"
                onClick={() => startEdit(field)}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{field.label}</span>
                    <Badge variant="secondary" className="text-xs border-0">
                      {FIELD_TYPES[field.field_type] || field.field_type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs border-0">
                      {WIDTH_OPTIONS[field.width] || field.width}
                    </Badge>
                    {field.required && (
                      <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-0">Requis</Badge>
                    )}
                  </div>
                  {field.field_type === "select" && Array.isArray(field.options) && field.options.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Options : {(field.options as string[]).join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteField.mutate(field.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="stat-card text-center py-12">
            <p className="text-sm text-muted-foreground">Aucun champ configuré</p>
            <p className="text-xs text-muted-foreground mt-1">Ajoutez des champs pour construire votre formulaire</p>
          </div>
        )}
      </div>

      {/* Add/Edit Field Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingField ? "Modifier le champ" : "Ajouter un champ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Nom complet" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type de champ</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Largeur</Label>
                <Select value={width} onValueChange={setWidth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(WIDTH_OPTIONS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!["heading", "separator", "checkbox"].includes(fieldType) && (
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Texte indicatif..." />
              </div>
            )}

            {fieldType === "dropdown_menu" && (
              <div className="space-y-2">
                <Label>Menu déroulant réutilisable</Label>
                <Select value={selectedDropdown} onValueChange={setSelectedDropdown}>
                  <SelectTrigger><SelectValue placeholder="Choisir un menu..." /></SelectTrigger>
                  <SelectContent>
                    {(dropdownMenus ?? [])
                      .filter((menu) => menu && menu.id && menu.name)
                      .map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!dropdownMenus?.length && (
                  <p className="text-xs text-muted-foreground">
                    Aucun menu créé. Allez dans Paramètres → Menus déroulants.
                  </p>
                )}
              </div>
            )}

            {needsOptions && fieldType !== "dropdown_menu" && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Ajouter une option"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-10">
                    <Plus className="w-4 h-4" />
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
            )}

            {!["heading", "separator"].includes(fieldType) && (
              <div className="flex items-center gap-2">
                <Switch checked={required} onCheckedChange={setRequired} />
                <Label className="text-sm">Champ obligatoire</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForm}>Annuler</Button>
            <Button
              onClick={() => editingField ? updateField.mutate() : addField.mutate()}
              disabled={addField.isPending || updateField.isPending || !label.trim()}
            >
              {(addField.isPending || updateField.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingField ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default FormFieldsEditor;
