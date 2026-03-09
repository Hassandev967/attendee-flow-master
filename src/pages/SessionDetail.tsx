import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Link as LinkIcon, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import EditSessionDialog from "@/components/EditSessionDialog";

const statusColors: Record<string, string> = {
  "A venir": "bg-info/10 text-info",
  "En cours": "bg-accent/10 text-accent",
  "Terminée": "bg-success/10 text-success",
  "Annulée": "bg-destructive/10 text-destructive",
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: formation, isLoading } = useQuery({
    queryKey: ["formation-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout title="Chargement...">
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!formation) {
    return (
      <AdminLayout title="Formation introuvable">
        <p className="text-muted-foreground">Cette formation n'existe pas.</p>
      </AdminLayout>
    );
  }

  const inscrits = (formation.inscriptions as any)?.[0]?.count ?? 0;
  const tauxRemplissage = formation.places > 0 ? Math.round((inscrits / formation.places) * 100) : 0;
  const inscriptionUrl = `${window.location.origin}/inscription/${formation.id}`;

  return (
    <AdminLayout title={formation.titre} subtitle={formation.theme}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <EditSessionDialog formation={{
          id: formation.id,
          titre: formation.titre,
          theme: formation.theme,
          date_debut: formation.date_debut,
          duree: formation.duree,
          lieu: formation.lieu,
          formateur: formation.formateur,
          places: formation.places,
          statut: formation.statut,
          image_url: (formation as any).image_url,
        }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Image de la formation */}
          {(formation as any).image_url && (
            <div className="w-36 h-36 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center mb-2">
              <img
                src={(formation as any).image_url}
                alt={formation.titre}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className={`${statusColors[formation.statut] || ""} border-0 font-medium text-xs`}>
                {formation.statut}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{format(new Date(formation.date_debut), "EEEE d MMMM yyyy", { locale: fr })}</span>
              </div>
              {formation.duree && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{formation.duree}</span>
                </div>
              )}
              {formation.lieu && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{formation.lieu}</span>
                </div>
              )}
              {formation.formateur && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-accent" />
                  <span>{formation.formateur}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-accent" />
                <span>{inscrits}/{formation.places} inscrits</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-accent" />
              Lien d'inscription
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg text-foreground break-all">
                {inscriptionUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(inscriptionUrl)}
              >
                Copier
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="stat-card text-center">
            <p className="text-sm text-muted-foreground mb-1">Taux de remplissage</p>
            <p className="text-3xl font-bold text-foreground">{tauxRemplissage}%</p>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: `${Math.min(100, tauxRemplissage)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formation.places - inscrits} places restantes
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={() => window.open(inscriptionUrl, "_blank")}>
            Voir formulaire d'inscription
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SessionDetail;
