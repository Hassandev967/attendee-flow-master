import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Filter,
  QrCode,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPinned,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import vdeLogo from "@/assets/vde-logo.png";
import ciExportLogo from "@/assets/ci-export-logo-blanc.png";

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

  const themes = formations ? [...new Set(formations.map((f) => f.theme))].sort() : [];

  const filtered = selectedTheme ? formations?.filter((f) => f.theme === selectedTheme) : formations;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-green-700">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">FORMATION PLATEFORME</h1>
            <p className="text-green-100 text-xs sm:text-sm mt-0.5">Choisissez une formation puis inscrivez-vous</p>
          </div>
          <Link to="/login" className="text-xs sm:text-sm text-green-100 hover:text-white transition-colors shrink-0">
            Espace admin
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1">
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
                  {formation.image_url && (
                    <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                      <img src={formation.image_url} alt={formation.titre} className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
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
                          {" "}
                          Lieu de Formation :
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
                      <Button disabled variant="secondary">
                        Complet
                      </Button>
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

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Logo + Réseaux sociaux */}
          <div className="space-y-4">
            <img src={ciExportLogo} alt="Agence CI Export" className="h-14 object-contain" />
            <p className="text-sm text-zinc-400">Agence Côte d'Ivoire Export</p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Facebook className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Twitter className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Col 2: Coordonnées */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Coordonnées</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPinned className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <span>Immeuble CGRAE, Adjamé-Indénié, Abidjan</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <span>+225 27 20 28 67 53 / +225 07 67 22 99 36</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <span>info@cotedivoirexport.ci</span>
              </div>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  A propos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  Atouts de la Côte d'Ivoire
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  Offres de services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  Programmes
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  Ressources
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Newsletter</h3>
            <p className="text-sm text-zinc-400">
              Inscrivez-vous à notre newsletter pour recevoir les dernières actualités.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Votre email"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">S'inscrire</Button>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
            <span>© Copyright 2025 Agence Côte d'Ivoire Export</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SessionsPublic;
