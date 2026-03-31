import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye, Trash2, Loader2, ToggleLeft, ToggleRight, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface DynamicForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
}

const FormBuilder = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const { data: forms, isLoading } = useQuery({
    queryKey: ["dynamic-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_forms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DynamicForm[];
    },
  });

  const createForm = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !slug.trim()) throw new Error("Titre et slug requis");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("dynamic_forms").insert({
        title: title.trim(),
        description: description.trim() || null,
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        is_public: isPublic,
        created_by: user?.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-forms"] });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setSlug("");
      setIsPublic(true);
      toast({ title: "Formulaire créé" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("dynamic_forms").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-forms"] }),
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dynamic_forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-forms"] });
      toast({ title: "Formulaire supprimé" });
    },
  });

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  return (
    <AdminLayout title="Formulaires" subtitle="Créez et gérez vos formulaires dynamiques">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {forms?.length || 0} formulaire(s)
            </Badge>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4" /> Nouveau formulaire
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : forms && forms.length > 0 ? (
          <div className="grid gap-4">
            {forms.map((form) => (
              <div key={form.id} className="stat-card flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{form.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">/{form.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    {form.is_public && (
                      <Badge variant="secondary" className="text-xs border-0">Public</Badge>
                    )}
                    <Badge variant={form.is_active ? "default" : "secondary"} className="text-xs border-0">
                      {form.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/admin/formulaires/${form.id}`)}
                    title="Modifier les champs"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(`/formulaire/${form.slug}`, "_blank")}
                    title="Voir le formulaire"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleActive.mutate({ id: form.id, is_active: !form.is_active })}
                    title={form.is_active ? "Désactiver" : "Activer"}
                  >
                    {form.is_active ? <ToggleRight className="w-4 h-4 text-accent" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Supprimer ce formulaire ?")) deleteForm.mutate(form.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stat-card text-center py-12">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun formulaire créé</p>
            <p className="text-xs text-muted-foreground mt-1">Créez votre premier formulaire pour commencer</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau formulaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)); }}
                placeholder="Ex: Formulaire de satisfaction"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/formulaire/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="satisfaction"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label className="text-sm">Formulaire public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={() => createForm.mutate()} disabled={createForm.isPending || !title.trim() || !slug.trim()}>
              {createForm.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default FormBuilder;
