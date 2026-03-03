import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const InscriptionForm = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = sessions.find((s) => s.id === sessionId);
  const [submitted, setSubmitted] = useState(false);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Session introuvable.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: "Inscription confirmée !", description: "Vous recevrez un email de confirmation avec votre QR code." });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="stat-card max-w-md w-full text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Inscription confirmée !</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Vous recevrez un email de confirmation avec votre QR code unique pour l'émargement.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="stat-card mb-6">
          <span className="text-xs font-medium text-accent uppercase tracking-wide">{session.thematique}</span>
          <h1 className="text-xl font-semibold text-foreground mt-1">{session.titre}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(session.date), "d MMMM yyyy", { locale: fr })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {session.lieu}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stat-card space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Formulaire d'inscription</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" required placeholder="Votre nom" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" required placeholder="Votre prénom" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input id="telephone" type="tel" required placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entreprise">Raison sociale *</Label>
              <Input id="entreprise" required placeholder="Nom de l'entreprise" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fonction">Fonction *</Label>
              <Input id="fonction" required placeholder="Votre fonction" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Secteur d'activité *</Label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Technologie</SelectItem>
                  <SelectItem value="agro">Agroalimentaire</SelectItem>
                  <SelectItem value="textile">Textile</SelectItem>
                  <SelectItem value="industrie">Industrie</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taille de l'entreprise *</Label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tpe">TPE (&lt;10 salariés)</SelectItem>
                  <SelectItem value="pme">PME (10-50)</SelectItem>
                  <SelectItem value="eti">ETI (50-250)</SelectItem>
                  <SelectItem value="ge">Grande entreprise (&gt;250)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expérience export *</Label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debutant">Débutant</SelectItem>
                  <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode de participation *</Label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentiel">Présentiel</SelectItem>
                  <SelectItem value="en_ligne">En ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Confirmer l'inscription
          </Button>
        </form>
      </div>
    </div>
  );
};

export default InscriptionForm;
