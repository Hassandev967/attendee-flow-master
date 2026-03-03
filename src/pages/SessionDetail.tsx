import AdminLayout from "@/components/AdminLayout";
import SessionStatusBadge from "@/components/SessionStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, User, ArrowLeft, Video, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const modeLabels: Record<string, string> = { presentiel: "Présentiel", en_ligne: "En ligne", hybride: "Hybride" };

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
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

  if (!session) {
    return (
      <AdminLayout title="Session introuvable">
        <p className="text-muted-foreground">Cette session n'existe pas.</p>
      </AdminLayout>
    );
  }

  const inscrits = (session.inscriptions as any)?.[0]?.count ?? 0;
  const tauxRemplissage = session.places > 0 ? Math.round((inscrits / session.places) * 100) : 0;
  const inscriptionUrl = `${window.location.origin}/inscription/${session.id}`;

  return (
    <AdminLayout title={session.titre} subtitle={session.thematique}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <SessionStatusBadge status={session.statut} />
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {modeLabels[session.mode] || session.mode}
              </span>
            </div>
            {session.description && (
              <p className="text-muted-foreground leading-relaxed">{session.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{format(new Date(session.date_session), "EEEE d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span>{session.horaire}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <span>{session.lieu}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-accent" />
                <span>{inscrits}/{session.places} inscrits</span>
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
                onClick={() => {
                  navigator.clipboard.writeText(inscriptionUrl);
                }}
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
              {session.places - inscrits} places restantes
            </p>
          </div>

          <div className="space-y-2">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Video className="w-4 h-4 mr-2" />
              Lancer l'émargement
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.open(inscriptionUrl, "_blank")}>
              Voir formulaire d'inscription
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SessionDetail;
