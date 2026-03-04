import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Filter, QrCode, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import vdeLogo from "@/assets/vde-logo.png";

const BASE_URL = window.location.origin;

const SessionsPublic = () => {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [qrFormation, setQrFormation] = useState<{ id: string; titre: string } | null>(null);

  const { data: formations, isLoading } = useQuery({
    queryKey: ["public-formations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count)")
        .in("statut", ["A venir", "En cours"])
        .order("date_debut", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const themes = formations
    ? [...new Set(formations.map((f) => f.theme))].sort()
    : [];

  const filtered = selectedTheme
    ? formations?.filter((f) => f.theme === selectedTheme)
    : formations;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center gap-4">
          <img src={vdeLogo} alt="ACIEX" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">FORMATION PLATEFORME</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Choisissez une formation puis inscrivez-vous
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {themes.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filtrer par thème :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTheme(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !selectedTheme
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                }`}
              >
                Toutes
              </button>
              {themes.map((th) => (
                <button
                  key={th}
                  onClick={() => setSelectedTheme(th)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedTheme === th
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
        ) : !filtered?.length ? (
          <div className="stat-card text-center py-16">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Aucune formation disponible</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Revenez bientôt pour découvrir nos prochaines formations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((formation) => {
              const inscrits = (formation.inscriptions as any)?.[0]?.count ?? 0;
              const placesRestantes = formation.places - inscrits;

              return (
                <div key={formation.id} className="stat-card flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-medium text-accent border-accent/30">
                        {formation.theme}
                      </Badge>
                      {formation.statut === "En cours" && (
                        <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-0">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{formation.titre}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
                      </span>
                      {formation.duree && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formation.duree}
                        </span>
                      )}
                      {formation.lieu && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {formation.lieu}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {placesRestantes > 0 ? `${placesRestantes} places restantes` : "Complet"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQrFormation({ id: formation.id, titre: formation.titre })}
                      title="QR code d'inscription"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    {placesRestantes > 0 ? (
                      <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link to={`/inscription/${formation.id}`}>S'inscrire</Link>
                      </Button>
                    ) : (
                      <Button disabled variant="secondary">Complet</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!qrFormation} onOpenChange={() => setQrFormation(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Scanner pour s'inscrire</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{qrFormation?.titre}</p>
          <div className="flex justify-center">
            <div className="bg-background rounded-xl p-6 border border-border inline-block">
              <QRCodeSVG
                value={`${BASE_URL}/inscription/${qrFormation?.id}`}
                size={200}
                level="H"
                includeMargin
                bgColor="transparent"
                fgColor="hsl(222, 47%, 11%)"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Scannez ce QR code avec votre téléphone pour accéder au formulaire d'inscription
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsPublic;
