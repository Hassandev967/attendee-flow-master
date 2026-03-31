import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle,
  Loader2,
  Download,
  QrCode,
  Clock,
  Users,
  Building2,
  Globe,
  GraduationCap,
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
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import ciExportLogo from "@/assets/ci-export-logo-blanc.png";

type Categorie = "entreprise" | "talent" | "jeune";

const CATEGORIES: { id: Categorie; label: string; icon: typeof Building2; accent: string; description: string }[] = [
  { id: "entreprise", label: "ENTREPRISES", icon: Building2, accent: "bg-amber-700", description: "Enregistrement des entreprises et organisations participantes" },
  { id: "talent", label: "TALENT EN MISSION", icon: Globe, accent: "bg-purple-700", description: "Enregistrement des talents africains en mission" },
  { id: "jeune", label: "JEUNE", icon: GraduationCap, accent: "bg-emerald-700", description: "Enregistrement des jeunes talents" },
];

const NIVEAU_ETUDE_OPTIONS = [
  "Bac",
  "Bac+2 / BTS / DUT",
  "Licence (Bac+3)",
  "Master (Bac+5)",
  "Doctorat / PhD",
  "Formation professionnelle",
  "Autre",
];

const baseSchema = z.object({
  nom: z.string().trim().min(1, "Requis"),
  prenom: z.string().trim().min(1, "Requis"),
  email: z.string().trim().email("Email invalide"),
  telephone: z.string().trim().min(1, "Requis"),
});

const entrepriseSchema = baseSchema.extend({
  entreprise: z.string().trim().min(1, "Requis"),
  fonction: z.string().trim().min(1, "Requis"),
});

const talentSchema = baseSchema.extend({
  entreprise: z.string().trim().min(1, "Requis"),
  pays_origine: z.string().trim().min(1, "Requis"),
});

const jeuneSchema = baseSchema.extend({
  niveau_etude: z.string().trim().min(1, "Requis"),
});

const schemas: Record<Categorie, z.ZodSchema> = {
  entreprise: entrepriseSchema,
  talent: talentSchema,
  jeune: jeuneSchema,
};

interface Formation {
  id: string;
  titre: string;
  theme: string;
  date_debut: string;
  duree: string | null;
  lieu: string | null;
  places: number;
  image_url: string | null;
  inscriptions: any;
}

interface EventInscriptionFormProps {
  formation: Formation;
  eventParticipantCount: number;
}

const EventInscriptionForm = ({ formation, eventParticipantCount }: EventInscriptionFormProps) => {
  const navigate = useNavigate();
  const [categorie, setCategorie] = useState<Categorie>("entreprise");
  const [submitted, setSubmitted] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [inscriptionInfo, setInscriptionInfo] = useState<{ nom: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentCat = CATEGORIES.find((c) => c.id === categorie)!;

  const switchCategory = (id: Categorie) => {
    setCategorie(id);
    setFormData({});
    setErrors({});
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const { error } = await supabase.from("event_participants").insert({
        formation_id: formation.id,
        categorie,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        entreprise: data.entreprise || null,
        fonction: data.fonction || null,
        pays_origine: data.pays_origine || null,
        niveau_etude: data.niveau_etude || null,
      });
      if (error) throw error;
      return { nom: `${data.prenom} ${data.nom}` };
    },
    onSuccess: (result) => {
      setQrCodeValue(`${window.location.origin}/inscription/${formation.id}`);
      setInscriptionInfo({ nom: result.nom });
      setSubmitted(true);
      toast({ title: "Inscription confirmée !", description: "Votre QR code a été généré." });
    },
    onError: (err: any) => {
      const msg = err.message?.includes("event_participants_formation_id_email_key")
        ? "Vous êtes déjà inscrit à cet événement."
        : err.message || "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schemas[categorie].safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      (result as any).error.errors.forEach((err: any) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    mutation.mutate(result.data as Record<string, string>);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `qr-inscription-evenement.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive">{errors[field]}</p> : null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="stat-card max-w-md w-full text-center py-10">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Inscription confirmée !</h2>
            <p className="text-sm text-muted-foreground mb-1">{inscriptionInfo?.nom}</p>
            <p className="text-xs text-muted-foreground mb-6">
              {formation.titre} — {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
            </p>

            <div className="bg-background rounded-xl p-6 border border-border mb-4 inline-block">
              <QRCodeSVG
                id="qr-code-svg"
                value={qrCodeValue}
                size={200}
                level="H"
                includeMargin
                bgColor="transparent"
                fgColor="hsl(222, 47%, 11%)"
              />
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              <QrCode className="w-3.5 h-3.5 inline mr-1" />
              Conservez ce QR code pour accéder à l'événement
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger le QR code
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="text-sm">
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
        <EventFooter />
      </div>
    );
  }

  const placesRestantes = formation.places - eventParticipantCount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-green-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">ÉVÉNEMENT</h1>
            <p className="text-green-100 text-xs sm:text-sm mt-0.5">Inscription à un événement</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-green-100 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Retour à l'accueil</span>
            <span className="sm:hidden">Retour</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Event info */}
        <div className="stat-card mb-6">
          {formation.image_url && (
            <div className="w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center mb-4">
              <img src={formation.image_url} alt={formation.titre} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <span className="text-xs font-medium text-accent uppercase tracking-wide">{formation.theme}</span>
          <h1 className="text-2xl font-bold text-foreground mt-2">{formation.titre}</h1>
          <div className="mt-4 space-y-2 text-lg text-muted-foreground">
            <p className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">Date :</span>{" "}
              {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
            </p>
            {formation.duree && (
              <p className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">Durée :</span> {formation.duree}
              </p>
            )}
            {formation.lieu && (
              <p className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">Lieu :</span> {formation.lieu}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">Participants :</span>{" "}
              {placesRestantes > 0 ? `${placesRestantes} places restantes` : "Complet"}
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="stat-card p-0 mb-0 overflow-hidden">
          <div className="flex border-b border-border">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => switchCategory(cat.id)}
                  className={`flex-1 px-3 py-4 text-center transition-all border-b-3 ${
                    categorie === cat.id
                      ? "bg-card border-b-2 border-accent text-foreground"
                      : "bg-muted/30 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1.5 ${categorie === cat.id ? "text-accent" : ""}`} />
                  <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase block">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">{currentCat.label}</h2>
              <p className="text-sm text-muted-foreground">{currentCat.description}</p>
            </div>

            {/* Entreprise-specific fields */}
            {categorie === "entreprise" && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Nom de l'Entreprise / Organisation *</Label>
                <Input
                  className="h-12 text-base"
                  value={formData.entreprise || ""}
                  onChange={(e) => updateField("entreprise", e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
                <FieldError field="entreprise" />
              </div>
            )}

            {/* Common: nom, prenom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {categorie === "entreprise" ? "Nom du représentant *" : "Nom *"}
                </Label>
                <Input
                  className="h-12 text-base"
                  value={formData.nom || ""}
                  onChange={(e) => updateField("nom", e.target.value)}
                  placeholder="Nom"
                />
                <FieldError field="nom" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {categorie === "entreprise" ? "Prénom du représentant *" : "Prénom *"}
                </Label>
                <Input
                  className="h-12 text-base"
                  value={formData.prenom || ""}
                  onChange={(e) => updateField("prenom", e.target.value)}
                  placeholder="Prénom"
                />
                <FieldError field="prenom" />
              </div>
            </div>

            {/* Entreprise: fonction */}
            {categorie === "entreprise" && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Fonction *</Label>
                <Input
                  className="h-12 text-base"
                  value={formData.fonction || ""}
                  onChange={(e) => updateField("fonction", e.target.value)}
                  placeholder="Ex: Directeur, Responsable commercial..."
                />
                <FieldError field="fonction" />
              </div>
            )}

            {/* Talent: entreprise + pays */}
            {categorie === "talent" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Entreprise *</Label>
                  <Input
                    className="h-12 text-base"
                    value={formData.entreprise || ""}
                    onChange={(e) => updateField("entreprise", e.target.value)}
                    placeholder="Nom de l'entreprise"
                  />
                  <FieldError field="entreprise" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Pays d'origine *</Label>
                  <Input
                    className="h-12 text-base"
                    value={formData.pays_origine || ""}
                    onChange={(e) => updateField("pays_origine", e.target.value)}
                    placeholder="Pays d'origine"
                  />
                  <FieldError field="pays_origine" />
                </div>
              </div>
            )}

            {/* Jeune: niveau d'étude */}
            {categorie === "jeune" && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Niveau d'étude *</Label>
                <Select value={formData.niveau_etude || ""} onValueChange={(v) => updateField("niveau_etude", v)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="— Sélectionner —" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVEAU_ETUDE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="niveau_etude" />
              </div>
            )}

            {/* Common: telephone, email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Téléphone *</Label>
                <Input
                  type="tel"
                  className="h-12 text-base"
                  value={formData.telephone || ""}
                  onChange={(e) => updateField("telephone", e.target.value)}
                  placeholder="+225 XX XX XX XX XX"
                />
                <FieldError field="telephone" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Email *</Label>
                <Input
                  type="email"
                  className="h-12 text-base"
                  value={formData.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="exemple@email.com"
                />
                <FieldError field="email" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmer l'inscription
            </Button>
          </form>
        </div>
      </main>

      <EventFooter />
    </div>
  );
};

const EventFooter = () => (
  <footer className="bg-zinc-900 text-zinc-300 mt-16">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <div className="space-y-4">
        <img src={ciExportLogo} alt="Agence CI Export" className="h-14 object-contain" />
        <p className="text-sm text-zinc-400">Agence Côte d'Ivoire Export</p>
        <div className="flex gap-3 pt-2">
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
              className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors"
            >
              <Icon className="w-4 h-4 text-white" />
            </a>
          ))}
        </div>
      </div>
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
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-lg">Navigation</h3>
        <ul className="space-y-2 text-sm">
          <li><a href="/" className="hover:text-orange-400 transition-colors">Accueil</a></li>
          <li><a href="https://cotedivoirexport.ci/a-propos/" className="hover:text-orange-400 transition-colors">A propos</a></li>
          <li><a href="https://cotedivoirexport.ci/offres-de-services/" className="hover:text-orange-400 transition-colors">Offres de services</a></li>
          <li><a href="https://cotedivoirexport.ci/programmes/" className="hover:text-orange-400 transition-colors">Programmes</a></li>
        </ul>
      </div>
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-lg">Newsletter</h3>
        <p className="text-sm text-zinc-400">
          Inscrivez-vous à notre newsletter pour recevoir les dernières actualités.
        </p>
      </div>
    </div>
    <div className="border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
        <span>© Copyright 2025 Agence Côte d'Ivoire Export</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-zinc-300 transition-colors">Politique de confidentialité</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
);

export default EventInscriptionForm;
