import AdminLayout from "@/components/AdminLayout";
import SessionStatusBadge from "@/components/SessionStatusBadge";
import { sessions } from "@/lib/mock-data";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, User, ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <AdminLayout title="Session introuvable">
        <p className="text-muted-foreground">Cette session n'existe pas.</p>
      </AdminLayout>
    );
  }

  const modeLabels = { presentiel: "Présentiel", en_ligne: "En ligne", hybride: "Hybride" };

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
                {modeLabels[session.mode]}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{session.description}</p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{format(new Date(session.date), "EEEE d MMMM yyyy", { locale: fr })}</span>
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
                <span>{session.inscrits}/{session.places} inscrits</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Intervenant(s)</h3>
            <div className="space-y-4">
              {session.intervenants.map((interv) => (
                <div key={interv.id} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{interv.nom}</p>
                    <p className="text-sm text-muted-foreground">{interv.titre} – {interv.organisation}</p>
                    <p className="text-sm text-muted-foreground mt-1">{interv.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="stat-card text-center">
            <p className="text-sm text-muted-foreground mb-1">Taux de remplissage</p>
            <p className="text-3xl font-bold text-foreground">
              {Math.round((session.inscrits / session.places) * 100)}%
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: `${Math.min(100, (session.inscrits / session.places) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {session.places - session.inscrits} places restantes
            </p>
          </div>

          <div className="space-y-2">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Video className="w-4 h-4 mr-2" />
              Lancer l'émargement
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(`/inscription/${session.id}`)}>
              Voir formulaire d'inscription
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SessionDetail;
