import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Monitor, Building2, Wifi, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const modeIcons = {
  presentiel: Building2,
  en_ligne: Monitor,
  hybride: Wifi,
};

const modeLabels = {
  presentiel: "Présentiel",
  en_ligne: "En ligne",
  hybride: "Hybride",
};

const SessionsPublic = () => {
  const [selectedThematique, setSelectedThematique] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["public-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, inscriptions(count)")
        .in("statut", ["publiee", "en_cours"])
        .order("date_session", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Extract unique thematiques
  const thematiques = sessions
    ? [...new Set(sessions.map((s) => s.thematique))].sort()
    : [];

  const filteredSessions = selectedThematique
    ? sessions?.filter((s) => s.thematique === selectedThematique)
    : sessions;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">Nos formations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choisissez une formation puis inscrivez-vous à la session qui vous convient
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Thematique filter chips */}
        {thematiques.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filtrer par formation :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedThematique(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !selectedThematique
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                }`}
              >
                Toutes les formations
              </button>
              {thematiques.map((th) => (
                <button
                  key={th}
                  onClick={() => setSelectedThematique(th)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedThematique === th
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="stat-card animate-pulse h-40" />
            ))}
          </div>
        ) : !filteredSessions?.length ? (
          <div className="stat-card text-center py-16">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Aucune session disponible</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {selectedThematique
                ? "Aucune session pour cette formation. Essayez une autre."
                : "Revenez bientôt pour découvrir nos prochaines formations."}
            </p>
            {selectedThematique && (
              <Button variant="outline" className="mt-4" onClick={() => setSelectedThematique(null)}>
                Voir toutes les formations
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Group sessions by thematique */}
            {(selectedThematique ? [selectedThematique] : thematiques.length > 0 ? thematiques : [""]).map((th) => {
              const group = filteredSessions?.filter((s) => (th ? s.thematique === th : true)) ?? [];
              if (!group.length) return null;

              return (
                <div key={th || "all"}>
                  {!selectedThematique && thematiques.length > 1 && (
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-accent rounded-full" />
                      {th}
                    </h2>
                  )}
                  <div className="grid gap-4">
                    {group.map((session) => {
                      const ModeIcon = modeIcons[session.mode] || Building2;
                      const inscrits = (session.inscriptions as any)?.[0]?.count ?? 0;
                      const placesRestantes = session.places - inscrits;

                      return (
                        <div key={session.id} className="stat-card flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-medium text-accent border-accent/30">
                                {session.thematique}
                              </Badge>
                              <Badge variant="secondary" className="text-xs gap-1">
                                <ModeIcon className="w-3 h-3" />
                                {modeLabels[session.mode]}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{session.titre}</h3>
                            {session.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(session.date_session), "d MMMM yyyy · HH'h'mm", { locale: fr })}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {session.lieu}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {placesRestantes > 0 ? `${placesRestantes} places restantes` : "Complet"}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {placesRestantes > 0 ? (
                              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Link to={`/inscription/${session.id}`}>S'inscrire</Link>
                              </Button>
                            ) : (
                              <Button disabled variant="secondary">Complet</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SessionsPublic;
