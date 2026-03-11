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
  GraduationCap,
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
  const [previewImage, setPreviewImage] = useState<{ url: string; titre: string } | null>(null);

  const { data: formations, isLoading } = useQuery({
    queryKey: ["public-formations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count)")
        .in("statut", ["A venir", "En cours"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const themes = formations ? [...new Set(formations.map((f) => f.theme))].sort() : [];
  const filtered = selectedTheme ? formations?.filter((f) => f.theme === selectedTheme) : formations;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-700 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMGgzNnYySDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={ciExportLogo} alt="Agence CI Export" className="h-12 sm:h-14 object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                  Nos formations<br />
                  <span className="text-accent">disponibles</span>
                </h1>
                <p className="text-green-100/70 text-base sm:text-lg max-w-xl leading-relaxed">
                  Découvrez nos programmes de renforcement des capacités et inscrivez-vous en ligne.
                </p>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <GraduationCap className="w-4 h-4 text-accent" />
                  <span className="text-white/90 text-sm font-medium">Programmes certifiants</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-white/90 text-sm font-medium">Inscription en ligne</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block shrink-0">
              <div className="w-44 h-44 lg:w-52 lg:h-52 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center p-6">
                <img src={vdeLogo} alt="VDE" className="max-w-full max-h-full object-contain opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" fill="hsl(210, 20%, 98%)" />
          </svg>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Theme filters */}
        {themes.length > 1 && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrer par thème</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTheme(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  !selectedTheme
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                }`}
              >
                Toutes
              </button>
              {themes.map((th) => (
                <button
                  key={th}
                  onClick={() => setSelectedTheme(th)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    selectedTheme === th
                      ? "bg-accent text-accent-foreground border-accent shadow-sm"
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
          <div className="stat-card text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Aucune formation disponible</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Revenez bientôt pour découvrir nos prochaines formations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 stagger-children">
            {filtered.map((formation) => {
              const inscrits = (formation.inscriptions as any)?.[0]?.count ?? 0;
              const placesRestantes = formation.places - inscrits;

              return (
                <div key={formation.id} className="stat-card flex flex-col md:flex-row md:items-start gap-5 py-6">
                  {formation.image_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: formation.image_url!, titre: formation.titre })}
                      className="shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden border border-border/40 bg-muted flex items-center justify-center cursor-zoom-in hover:ring-2 hover:ring-accent/50 transition-all duration-200"
                    >
                      <img
                        src={formation.image_url}
                        alt={formation.titre}
                        className="max-w-full max-h-full object-contain"
                      />
                    </button>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-semibold text-accent border-accent/30 uppercase tracking-wider">
                        {formation.theme}
                      </Badge>
                      {formation.statut === "En cours" && (
                        <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent border-0">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">{formation.titre}</h3>
                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-accent shrink-0" />
                        <span className="font-bold text-foreground">Thème :</span>
                        {formation.theme}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent shrink-0" />
                        <span className="font-bold text-foreground">Date :</span>
                        {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
                      </span>
                      {formation.duree && (
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent shrink-0" />
                          <span className="font-medium text-foreground">Durée :</span>
                          {formation.duree}
                        </span>
                      )}
                      {formation.lieu && (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-accent shrink-0" />
                          <span className="font-medium text-foreground">Lieu :</span>
                          {formation.lieu}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent shrink-0" />
                        <span className="font-medium text-foreground">Places :</span>
                        {placesRestantes > 0 ? `${placesRestantes} restantes` : "Complet"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-stretch gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrFormation({ id: formation.id, titre: formation.titre })}
                      className="gap-2 text-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR Code
                    </Button>
                    {(() => {
                      const deadline = new Date(formation.date_debut);
                      deadline.setDate(deadline.getDate() - 1);
                      const isClosed = new Date() >= deadline;
                      if (isClosed) {
                        return <Button disabled variant="secondary" size="sm" className="text-xs">Fermée</Button>;
                      }
                      if (placesRestantes <= 0) {
                        return <Button disabled variant="secondary" size="sm" className="text-xs">Complet</Button>;
                      }
                      return (
                        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
                          <Link to={`/inscription/${formation.id}`}>S'inscrire</Link>
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QR Dialog */}
      <Dialog open={!!qrFormation} onOpenChange={() => setQrFormation(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-base">Scanner pour s'inscrire</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{qrFormation?.titre}</p>
          <div className="flex justify-center">
            <div className="bg-background rounded-xl p-6 border border-border/40 inline-block">
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
            Scannez ce QR code pour accéder au formulaire d'inscription
          </p>
        </DialogContent>
      </Dialog>

      {/* Image preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-base">{previewImage?.titre}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={previewImage?.url}
              alt={previewImage?.titre}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-foreground text-muted mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <img src={ciExportLogo} alt="Agence CI Export" className="h-12 object-contain" />
            <p className="text-sm text-primary-foreground/60">Agence Côte d'Ivoire Export</p>
            <div className="flex gap-2 pt-2">
              {[
                { icon: Facebook, href: "https://facebook.com" },
                { icon: Instagram, href: "https://instagram.com" },
                { icon: Twitter, href: "https://twitter.com" },
                { icon: Linkedin, href: "https://linkedin.com" },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-accent/90 flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-accent-foreground" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-primary-foreground font-semibold text-sm uppercase tracking-wide">Coordonnées</h3>
            <div className="space-y-3 text-sm text-primary-foreground/60">
              <div className="flex items-start gap-2">
                <MapPinned className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span>Immeuble CGRAE, Adjamé-Indénié, Abidjan</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span>+225 27 20 28 67 53</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span>info@cotedivoirexport.ci</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-primary-foreground font-semibold text-sm uppercase tracking-wide">Navigation</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              {["Accueil", "A propos", "Offres de services", "Programmes", "Ressources"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-accent transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-primary-foreground font-semibold text-sm uppercase tracking-wide">Newsletter</h3>
            <p className="text-sm text-primary-foreground/60">
              Recevez les dernières actualités.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Votre email"
                className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 text-sm h-9"
              />
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0 h-9">
                OK
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-foreground/40 gap-2">
            <span>© 2025 Agence Côte d'Ivoire Export</span>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-primary-foreground/70 transition-colors">
                Espace admin
              </Link>
              <a href="#" className="hover:text-primary-foreground/70 transition-colors">
                Confidentialité
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SessionsPublic;
