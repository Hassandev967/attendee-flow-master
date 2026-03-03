import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, CheckCircle, Loader2, Download, QrCode } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import vdeLogo from "@/assets/vde-logo.png";

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
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [inscriptionInfo, setInscriptionInfo] = useState<{ nom: string; prenom: string } | null>(null);
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

      const qrCode = crypto.randomUUID();

      // Create inscription
      const { error: iErr } = await supabase.from("inscriptions").insert({
        session_id: sessionId!,
        participant_id: participant.id,
        mode_participation: data.mode_participation,
        qr_code: qrCode,
      });
      if (iErr) throw iErr;

      return { qrCode, nom: data.nom, prenom: data.prenom };
    },
    onSuccess: (result) => {
      setQrCodeValue(result.qrCode);
      setInscriptionInfo({ nom: result.nom, prenom: result.prenom });
      setSubmitted(true);
      toast({ title: "Inscription confirmée !", description: "Votre QR code a été généré." });
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
      link.download = `qr-inscription-${qrCodeValue.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
        <div className="stat-card max-w-md w-full text-center py-10">
          <div className="flex justify-center mb-4">
            <img src={vdeLogo} alt="VDE" className="w-10 h-10 rounded-lg" />
          </div>
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Inscription confirmée !</h2>
          <p className="text-sm text-muted-foreground mb-1">
            {inscriptionInfo?.prenom} {inscriptionInfo?.nom}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            {session.titre} — {format(new Date(session.date_session), "d MMMM yyyy", { locale: fr })}
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
            Présentez ce QR code le jour de la formation pour l'émargement
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Télécharger le QR code
            </Button>
            <Button variant="ghost" onClick={() => navigate("/formations")} className="text-sm">
              Voir les autres formations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/formations")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <img src={vdeLogo} alt="VDE" className="w-8 h-8 rounded-lg" />
        </div>

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
              <Input id="telephone" type="tel" value={formData.telephone || ""} onChange={(e) => updateField("telephone", e.target.value)} placeholder="+225 07 12 34 56 78" />
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
