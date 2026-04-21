import AdminLayout from "@/components/AdminLayout";
import CreateSessionDialog from "@/components/CreateSessionDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Filter, Calendar, MapPin, Users, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type FormationStatut = "A venir" | "En cours" | "Terminée" | "Annulée" | "all";

const statusFilters: { label: string; value: FormationStatut }[] = [
  { label: "Toutes", value: "all" },
  { label: "À venir", value: "A venir" },
  { label: "En cours", value: "En cours" },
  { label: "Terminées", value: "Terminée" },
  { label: "Annulées", value: "Annulée" },
];

const statusColors: Record<string, string> = {
  "A venir": "bg-info/10 text-info",
  "En cours": "bg-accent/10 text-accent",
  "Terminée": "bg-success/10 text-success",
  "Annulée": "bg-destructive/10 text-destructive",
};

const SUPERADMIN_EMAILS = ["t.coulibaly@cotedivoirexport.ci", "h.cisse@cotedivoirexport.ci"];

const Sessions = () => {
  const [filter, setFilter] = useState<FormationStatut>("all");
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.email ? SUPERADMIN_EMAILS.includes(user.email) : false;

  const { data: formations, isLoading } = useQuery({
    queryKey: ["admin-formations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count)")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteFormation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("inscriptions").delete().eq("formation_id", id);
      const { error } = await supabase.from("formations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-formations"] });
      toast({ title: "Formation supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const filtered = formations
    ? filter === "all"
      ? formations
      : formations.filter((f) => f.statut === filter)
    : [];

  return (
    <AdminLayout title="Formations" subtitle="Gérez vos formations">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 flex-wrap bg-muted/50 p-1 rounded-lg">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all duration-200 ${
                filter === f.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <CreateSessionDialog />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((formation) => {
            const inscrits = (formation.inscriptions as any)?.[0]?.count ?? 0;
            const pct = Math.min(100, Math.round((inscrits / formation.places) * 100));
            return (
              <div
                key={formation.id}
                onClick={() => navigate(`/admin/sessions/${formation.id}`)}
                className="stat-card cursor-pointer group overflow-hidden"
              >
                {(formation as any).image_url && (
                  <div className="w-20 h-20 -ml-1 -mt-1 mb-3 rounded-lg overflow-hidden border border-border/40 bg-muted flex items-center justify-center">
                    <img src={(formation as any).image_url} alt={formation.titre} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">
                    {formation.theme}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive/60 hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette formation ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              « {formation.titre} » sera définitivement supprimée avec toutes ses inscriptions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFormation.mutate(formation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Badge variant="secondary" className={`${statusColors[formation.statut] || ""} border-0 font-medium text-[10px]`}>
                      {formation.statut}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 text-sm">
                  {formation.titre}
                </h3>
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
                  </div>
                  {formation.lieu && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {formation.lieu}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {inscrits}/{formation.places} inscrits
                  </div>
                </div>
                <div className="mt-4 w-full bg-muted rounded-full h-1">
                  <div
                    className="bg-accent h-1 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Filter className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">Aucune formation trouvée.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default Sessions;
