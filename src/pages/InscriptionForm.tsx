import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, CheckCircle, Loader2, Download, QrCode, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import vdeLogo from "@/assets/vde-logo.png";

const inscriptionSchema = z.object({
  nom_entreprise: z.string().trim().min(1, "Requis").max(255),
  nom_dirigeant: z.string().trim().min(1, "Requis").max(255),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().trim().min(1, "Requis").max(30),
  source_id: z.number().optional(),
  secteur_ids: z.array(z.number()).min(1, "Sélectionnez au moins un secteur"),
});

type InscriptionData = z.infer<typeof inscriptionSchema>;

const InscriptionForm = () => {
  const { sessionId: formationId } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [inscriptionInfo, setInscriptionInfo] = useState<{ nom: string } | null>(null);
  const [formData, setFormData] = useState<Partial<InscriptionData>>({ secteur_ids: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: formation, isLoading } = useQuery({
    queryKey: ["formation", formationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*")
        .eq("id", formationId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formationId,
  });

  const { data: secteurs } = useQuery({
    queryKey: ["secteurs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secteurs").select("*").order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { data: sources } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sources_information").select("*").order("nom");
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InscriptionData) => {
      // Upsert participant by email
      const { data: participant, error: pErr } = await supabase
        .from("participants")
        .upsert(
          {
            nom_entreprise: data.nom_entreprise,
            nom_dirigeant: data.nom_dirigeant,
            email: data.email,
            telephone: data.telephone,
            source_id: data.source_id || null,
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();
      if (pErr) throw pErr;

      // Insert participant_secteurs
      if (data.secteur_ids.length > 0) {
        const secteurRows = data.secteur_ids.map((sid) => ({
          participant_id: participant.id,
          secteur_id: sid,
        }));
        // Delete existing then insert (upsert not easy with composite PK)
        await supabase
          .from("participant_secteurs")
          .delete()
          .eq("participant_id", participant.id);
        const { error: sErr } = await supabase
          .from("participant_secteurs")
          .insert(secteurRows);
        if (sErr) throw sErr;
      }

      // Create inscription
      const { error: iErr } = await supabase.from("inscriptions").insert({
        formation_id: formationId!,
        participant_id: participant.id,
      });
      if (iErr) throw iErr;

      const qrCode = `${window.location.origin}/inscription/${formationId}`;
      return { qrCode, nom: data.nom_dirigeant };
    },
    onSuccess: (result) => {
      setQrCodeValue(result.qrCode);
      setInscriptionInfo({ nom: result.nom });
      setSubmitted(true);
      toast({ title: "Inscription confirmée !", description: "Votre QR code a été généré." });
    },
    onError: (err: any) => {
      const msg = err.message?.includes("uq_inscription")
        ? "Vous êtes déjà inscrit à cette formation."
        : err.message || "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleSecteur = (id: number) => {
    const current = formData.secteur_ids || [];
    const updated = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    updateField("secteur_ids", updated);
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
      link.download = `qr-inscription.png`;
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

  if (!formation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Formation introuvable.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="stat-card max-w-md w-full text-center py-10">
          <div className="flex justify-center mb-4">
            <img src={vdeLogo} alt="ACIEX" className="w-10 h-10 rounded-lg" />
          </div>
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
            Conservez ce QR code pour accéder à la formation
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Télécharger le QR code
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-sm">
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
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <img src={vdeLogo} alt="ACIEX" className="w-8 h-8 rounded-lg" />
        </div>

        <div className="stat-card mb-6">
          <span className="text-xs font-medium text-accent uppercase tracking-wide">{formation.theme}</span>
          <h1 className="text-xl font-semibold text-foreground mt-1">{formation.titre}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
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
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stat-card space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Formulaire d'inscription</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_dirigeant">Nom du dirigeant *</Label>
              <Input id="nom_dirigeant" value={formData.nom_dirigeant || ""} onChange={(e) => updateField("nom_dirigeant", e.target.value)} placeholder="Nom complet" />
              <FieldError field="nom_dirigeant" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom_entreprise">Raison sociale *</Label>
              <Input id="nom_entreprise" value={formData.nom_entreprise || ""} onChange={(e) => updateField("nom_entreprise", e.target.value)} placeholder="Nom de l'entreprise" />
              <FieldError field="nom_entreprise" />
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

          <div className="space-y-3">
            <Label>Secteur(s) d'activité *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {secteurs?.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(formData.secteur_ids || []).includes(s.id)}
                    onCheckedChange={() => toggleSecteur(s.id)}
                  />
                  {s.nom}
                </label>
              ))}
            </div>
            <FieldError field="secteur_ids" />
          </div>

          <div className="space-y-2">
            <Label>Comment avez-vous entendu parler de nous ?</Label>
            <Select
              value={formData.source_id?.toString()}
              onValueChange={(v) => updateField("source_id", parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner (optionnel)" /></SelectTrigger>
              <SelectContent>
                {sources?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
