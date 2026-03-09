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

const Sessions = () => {
  const [filter, setFilter] = useState<FormationStatut>("all");
  const navigate = useNavigate();

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

  const filtered = formations
    ? filter === "all"
      ? formations
      : formations.filter((f) => f.statut === filter)
    : [];

  return (
    <AdminLayout title="Formations" subtitle="Gérez vos formations">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((formation) => {
            const inscrits = (formation.inscriptions as any)?.[0]?.count ?? 0;
            return (
              <div
                key={formation.id}
                onClick={() => navigate(`/admin/sessions/${formation.id}`)}
                className="stat-card cursor-pointer group overflow-hidden"
              >
                {(formation as any).image_url && (
                  <div className="w-24 h-24 -ml-1 -mt-1 mb-3 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    <img src={(formation as any).image_url} alt={formation.titre} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-accent uppercase tracking-wide">
                    {formation.theme}
                  </span>
                  <Badge variant="secondary" className={`${statusColors[formation.statut] || ""} border-0 font-medium text-xs`}>
                    {formation.statut}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                  {formation.titre}
                </h3>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
                  </div>
                  {formation.lieu && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {formation.lieu}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    {inscrits}/{formation.places} inscrits
                  </div>
                </div>
                <div className="mt-4 w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (inscrits / formation.places) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune formation trouvée.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default Sessions;
