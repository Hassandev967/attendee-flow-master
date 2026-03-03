import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const inscriptionSchema = z.object({
  nom: z.string().trim().min(1, "Requis").max(100),
  prenom: z.string().trim().min(1, "Requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().trim().min(1, "Requis").max(20),
  entreprise: z.string().trim().min(1, "Requis").max(200),
  fonction: z.string().trim().min(1, "Requis").max(100),
  secteur: z.string().min(1, "Requis"),
  taille: z.string().min(1, "Requis"),
  niveau_export: z.enum(["debutant", "intermediaire", "confirme"]),
  mode_participation: z.enum(["presentiel", "en_ligne"]),
});

type InscriptionData = z.infer<typeof inscriptionSchema>;

const InscriptionForm = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Partial<InscriptionData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const mutation = useMutation({
    mutationFn: async (data: InscriptionData) => {
      // Upsert participant by email
      const { data: participant, error: pErr } = await supabase
        .from("participants")
        .upsert(
          {
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone,
            entreprise: data.entreprise,
            fonction: data.fonction,
            secteur: data.secteur,
            taille: data.taille,
            niveau_export: data.niveau_export,
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();
      if (pErr) throw pErr;

      // Create inscription
      const { error: iErr } = await supabase.from("inscriptions").insert({
        session_id: sessionId!,
        participant_id: participant.id,
        mode_participation: data.mode_participation,
        qr_code: crypto.randomUUID(),
      });
      if (iErr) throw iErr;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Inscription confirmée !", description: "Vous recevrez un email de confirmation." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue.", variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = inscriptionSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    mutation.mutate(result.data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Session introuvable.</p>
      </div>
    );
  }

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
          <Button variant="outline" onClick={() => navigate("/formations")}>
            Voir les autres sessions
          </Button>
        </div>
      </div>
    );
  }

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/formations")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux sessions
        </button>

        <div className="stat-card mb-6">
          <span className="text-xs font-medium text-accent uppercase tracking-wide">{session.thematique}</span>
          <h1 className="text-xl font-semibold text-foreground mt-1">{session.titre}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(session.date_session), "d MMMM yyyy · HH'h'mm", { locale: fr })}
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
              <Input id="nom" value={formData.nom || ""} onChange={(e) => updateField("nom", e.target.value)} placeholder="Votre nom" />
              <FieldError field="nom" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" value={formData.prenom || ""} onChange={(e) => updateField("prenom", e.target.value)} placeholder="Votre prénom" />
              <FieldError field="prenom" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="email@exemple.com" />
              <FieldError field="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input id="telephone" type="tel" value={formData.telephone || ""} onChange={(e) => updateField("telephone", e.target.value)} placeholder="+33 6 12 34 56 78" />
              <FieldError field="telephone" />
            </div>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entreprise">Raison sociale *</Label>
              <Input id="entreprise" value={formData.entreprise || ""} onChange={(e) => updateField("entreprise", e.target.value)} placeholder="Nom de l'entreprise" />
              <FieldError field="entreprise" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fonction">Fonction *</Label>
              <Input id="fonction" value={formData.fonction || ""} onChange={(e) => updateField("fonction", e.target.value)} placeholder="Votre fonction" />
              <FieldError field="fonction" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Secteur d'activité *</Label>
              <Select value={formData.secteur} onValueChange={(v) => updateField("secteur", v)}>
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
              <FieldError field="secteur" />
            </div>
            <div className="space-y-2">
              <Label>Taille de l'entreprise *</Label>
              <Select value={formData.taille} onValueChange={(v) => updateField("taille", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tpe">TPE (&lt;10 salariés)</SelectItem>
                  <SelectItem value="pme">PME (10-50)</SelectItem>
                  <SelectItem value="eti">ETI (50-250)</SelectItem>
                  <SelectItem value="ge">Grande entreprise (&gt;250)</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="taille" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expérience export *</Label>
              <Select value={formData.niveau_export} onValueChange={(v) => updateField("niveau_export", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debutant">Débutant</SelectItem>
                  <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="niveau_export" />
            </div>
            <div className="space-y-2">
              <Label>Mode de participation *</Label>
              <Select value={formData.mode_participation} onValueChange={(v) => updateField("mode_participation", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentiel">Présentiel</SelectItem>
                  <SelectItem value="en_ligne">En ligne</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="mode_participation" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmer l'inscription
          </Button>
        </form>
      </div>
    </div>
  );
};

export default InscriptionForm;
