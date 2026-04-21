import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  MapPin,
  CheckCircle,
  Loader2,
  Download,
  QrCode,
  Clock,
  Users,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPinned,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import ciExportLogo from "@/assets/ci-export-logo-blanc.png";

const inscriptionSchema = z.object({
  civilite: z.string().trim().min(1, "Requis"),
  nom: z.string().trim().min(1, "Requis").max(255),
  prenoms: z.string().trim().min(1, "Requis").max(255),
  fonction: z.string().trim().min(1, "Requis").max(255),
  nom_entreprise: z.string().trim().min(1, "Requis").max(255),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().trim().min(1, "Requis").max(30),
  source_id: z.number({ required_error: "Requis" }),
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
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [autreSecteur, setAutreSecteur] = useState(false);
  const [autreSecteurTexte, setAutreSecteurTexte] = useState("");
  const [autreSource, setAutreSource] = useState(false);
  const [autreSourceTexte, setAutreSourceTexte] = useState("");

  const { data: formation, isLoading } = useQuery({
    queryKey: ["formation", formationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count)")
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

  const { data: customFields } = useQuery({
    queryKey: ["custom-fields-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // ✅ Fonction de téléchargement du QR code
  const downloadQRCode = (nom: string) => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      const nomFichier = nom
        ? `qr-${nom.replace(/\s+/g, "-").toLowerCase()}.png`
        : "qr-inscription.png";
      link.download = nomFichier;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // ✅ Notification après téléchargement automatique
      toast({
        title: "📱 QR Code téléchargé !",
        description:
          "Ce QR code vous sera demandé le jour de l'événement pour confirmer votre présence. Conservez-le précieusement.",
        duration: 8000,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast({
        title: "Erreur de téléchargement",
        description:
          "Le téléchargement automatique a échoué. Veuillez cliquer sur 'Télécharger à nouveau'.",
        variant: "destructive",
      });
    };

    img.src = url;
  };

  // ✅ Téléchargement automatique dès que la page de confirmation s'affiche
  useEffect(() => {
    if (submitted && qrCodeValue) {
      // Délai de 800ms pour laisser le SVG se rendre dans le DOM
      const timer = setTimeout(() => {
        downloadQRCode(inscriptionInfo?.nom || "");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [submitted, qrCodeValue]);

  const mutation = useMutation({
    mutationFn: async (data: InscriptionData) => {
      const nomComplet = `${data.civilite} ${data.nom} ${data.prenoms}`;
      const { error } = await supabase.rpc("inscrire_participant", {
        p_formation_id: formationId!,
        p_nom_entreprise: data.nom_entreprise,
        p_nom_dirigeant: `${nomComplet} — ${data.fonction}`,
        p_email: data.email,
        p_telephone: data.telephone,
        p_source_id: data.source_id || null,
        p_secteur_ids: data.secteur_ids,
      });
      if (error) throw error;

      // Save custom field values
      if (customFields && customFields.length > 0) {
        const valuesToInsert = customFields
          .filter((f) => customValues[f.id] !== undefined && customValues[f.id] !== "")
          .map((f) => {
            let val = customValues[f.id];
            const preciser = customValues[`${f.id}_preciser`];
            if (preciser) val = `${val} : ${preciser}`;
            return {
              custom_field_id: f.id,
              formation_id: formationId!,
              participant_email: data.email,
              value: val,
            };
          });
        if (valuesToInsert.length > 0) {
          const { error: valError } = await supabase.from("custom_field_values").insert(valuesToInsert);
          if (valError) console.error("Custom field values error:", valError);
        }
      }

      const qrCode = `${window.location.origin}/presence/${formationId}/${data.email}`;
      return { qrCode, nom: `${data.civilite} ${data.nom} ${data.prenoms}` };
    },
    onSuccess: (result) => {
      setQrCodeValue(result.qrCode);
      setInscriptionInfo({ nom: result.nom });
      setSubmitted(true);
      toast({
        title: "✅ Inscription confirmée !",
        description: "Votre QR code est en cours de téléchargement...",
        duration: 4000,
      });
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
    if (customFields) {
      const customErrors: Record<string, string> = {};
      for (const f of customFields) {
        if (f.required && (!customValues[f.id] || customValues[f.id].trim() === "")) {
          customErrors[`custom_${f.id}`] = "Ce champ est requis";
        }
      }
      if (Object.keys(customErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...customErrors }));
        return;
      }
    }
    mutation.mutate(result.data);
  };

  // ✅ Bouton de téléchargement manuel
  const handleDownloadQR = () => {
    downloadQRCode(inscriptionInfo?.nom || "");
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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="stat-card max-w-md w-full text-center py-10">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Inscription confirmée !</h2>
            <p className="text-sm text-muted-foreground mb-1">{inscriptionInfo?.nom}</p>
            <p className="text-xs text-muted-foreground mb-6">
              {formation.titre} —{" "}
              {format(new Date(formation.date_debut), "d MMMM yyyy", { locale: fr })}
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

            {/* ✅ Bannière d'information importante */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">
                    Important — Conservez ce QR code
                  </p>
                  <p className="text-xs text-amber-700">
                    Ce QR code vous sera demandé le jour de l'événement pour confirmer
                    votre présence. Il a été automatiquement téléchargé sur votre appareil.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              <QrCode className="w-3.5 h-3.5 inline mr-1" />
              Le QR code a été téléchargé automatiquement sur votre appareil
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger à nouveau
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="text-sm">
                Voir les autres formations
              </Button>
            </div>
          </div>
        </div>
        <InscriptionFooter />
      </div>
    );
  }

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-green-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">FORMATION PLATEFORME</h1>
            <p className="text-green-100 text-xs sm:text-sm mt-0.5">Inscription à une formation</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-green-100 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Retour aux formations</span>
            <span className="sm:hidden">Retour</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="stat-card mb-6">
          {formation.image_url && (
            <div className="w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center mb-4">
              <img
                src={formation.image_url}
                alt={formation.titre}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <span className="text-xs font-medium text-accent uppercase tracking-wide">
            {formation.theme}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-2">{formation.titre}</h1>
          <div className="mt-4 space-y-2 text-lg text-muted-foreground">
            <p className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              <span className="font-bold text-foreground">Thème :</span>{" "}
              <span className="font-bold">{formation.theme}</span>
            </p>
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
                <span className="font-semibold text-foreground">Lieu de Formation :</span>{" "}
                {formation.lieu}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">Participants :</span>{" "}
              {(() => {
                const inscrits = (formation.inscriptions as any)?.[0]?.count ?? 0;
                const restantes = formation.places - inscrits;
                return restantes > 0 ? `${restantes} places restantes` : "Complet";
              })()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stat-card space-y-8 p-8">
          <h2 className="text-2xl font-bold text-foreground">Formulaire d'inscription</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="civilite" className="text-base font-semibold">Civilité *</Label>
              <Select value={formData.civilite || ""} onValueChange={(v) => updateField("civilite", v)}>
                <SelectTrigger id="civilite" className="h-12 text-base">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monsieur">Monsieur</SelectItem>
                  <SelectItem value="Madame">Madame</SelectItem>
                  <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="civilite" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-base font-semibold">Nom *</Label>
              <Input
                id="nom"
                className="h-12 text-base"
                value={formData.nom || ""}
                onChange={(e) => updateField("nom", e.target.value)}
                placeholder="Nom de famille"
              />
              <FieldError field="nom" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenoms" className="text-base font-semibold">Prénom(s) *</Label>
              <Input
                id="prenoms"
                className="h-12 text-base"
                value={formData.prenoms || ""}
                onChange={(e) => updateField("prenoms", e.target.value)}
                placeholder="Prénom(s)"
              />
              <FieldError field="prenoms" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fonction" className="text-base font-semibold">Fonction / Poste *</Label>
              <Input
                id="fonction"
                className="h-12 text-base"
                value={formData.fonction || ""}
                onChange={(e) => updateField("fonction", e.target.value)}
                placeholder="Ex: Directeur commercial"
              />
              <FieldError field="fonction" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nom_entreprise" className="text-base font-semibold">Raison sociale *</Label>
              <Input
                id="nom_entreprise"
                className="h-12 text-base"
                value={formData.nom_entreprise || ""}
                onChange={(e) => updateField("nom_entreprise", e.target.value)}
                placeholder="Nom de l'entreprise"
              />
              <FieldError field="nom_entreprise" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold">Email *</Label>
              <Input
                id="email"
                type="email"
                className="h-12 text-base"
                value={formData.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="email@exemple.com"
              />
              <FieldError field="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-base font-semibold">Téléphone *</Label>
              <Input
                id="telephone"
                type="tel"
                className="h-12 text-base"
                value={formData.telephone || ""}
                onChange={(e) => updateField("telephone", e.target.value)}
                placeholder="+225 07 12 34 56 78"
              />
              <FieldError field="telephone" />
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-4">
            <Label className="text-base font-semibold">Secteur(s) d'activité(s) *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {secteurs?.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-base cursor-pointer">
                  <Checkbox
                    checked={(formData.secteur_ids || []).includes(s.id)}
                    onCheckedChange={() => toggleSecteur(s.id)}
                  />
                  {s.nom}
                </label>
              ))}
              <label className="flex items-center gap-2 text-base cursor-pointer">
                <Checkbox
                  checked={autreSecteur}
                  onCheckedChange={(checked) => {
                    setAutreSecteur(!!checked);
                    if (!checked) setAutreSecteurTexte("");
                  }}
                />
                Autre
              </label>
            </div>
            {autreSecteur && (
              <Input
                value={autreSecteurTexte}
                onChange={(e) => setAutreSecteurTexte(e.target.value)}
                placeholder="À préciser..."
                className="mt-2"
              />
            )}
            <FieldError field="secteur_ids" />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Comment avez-vous entendu parler de nous ?{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={autreSource ? "autre" : formData.source_id?.toString() || ""}
              onValueChange={(v) => {
                if (v === "autre") {
                  setAutreSource(true);
                  updateField("source_id", undefined);
                } else {
                  setAutreSource(false);
                  setAutreSourceTexte("");
                  updateField("source_id", parseInt(v));
                }
              }}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Sélectionner (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {sources?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.nom}</SelectItem>
                ))}
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            {autreSource && (
              <Input
                value={autreSourceTexte}
                onChange={(e) => setAutreSourceTexte(e.target.value)}
                placeholder="À préciser..."
                className="mt-2 h-12 text-base"
              />
            )}
            {!autreSource &&
              sources?.find((s) => s.id === formData.source_id && s.nom === "Partenariat") && (
                <Input
                  value={autreSourceTexte}
                  onChange={(e) => setAutreSourceTexte(e.target.value)}
                  placeholder="Préciser le partenariat..."
                  className="mt-2 h-12 text-base"
                />
              )}
            <FieldError field="source_id" />
          </div>

          {customFields && customFields.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Informations complémentaires</Label>
                {customFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={`custom_${field.id}`}>
                      {field.label} {field.required && "*"}
                    </Label>
                    {(() => {
                      const ft = (field.field_type || "text").toLowerCase();
                      const isSelect = ["select", "dropdown", "dropdown_menu", "list"].includes(ft);
                      const isNumber = ft === "number";
                      const isCheckbox = ft === "checkbox";
                      const isText = !isSelect && !isNumber && !isCheckbox;
                      return (
                        <>
                          {isText && (
                            <Input
                              id={`custom_${field.id}`}
                              value={customValues[field.id] || ""}
                              onChange={(e) => {
                                setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                                setErrors((prev) => ({ ...prev, [`custom_${field.id}`]: "" }));
                              }}
                              placeholder={field.label}
                            />
                          )}
                          {isNumber && (
                            <Input
                              id={`custom_${field.id}`}
                              type="number"
                              value={customValues[field.id] || ""}
                              onChange={(e) => {
                                setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                                setErrors((prev) => ({ ...prev, [`custom_${field.id}`]: "" }));
                              }}
                              placeholder={field.label}
                            />
                          )}
                          {isSelect && (
                            <>
                              <Select
                                value={customValues[field.id] || ""}
                                onValueChange={(v) => {
                                  setCustomValues((prev) => ({
                                    ...prev,
                                    [field.id]: v,
                                    [`${field.id}_preciser`]: "",
                                  }));
                                  setErrors((prev) => ({ ...prev, [`custom_${field.id}`]: "" }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.isArray(field.options) &&
                                    (field.options as any[])
                                      .map((opt) =>
                                        typeof opt === "string" ? opt : opt?.value ?? opt?.label ?? ""
                                      )
                                      .filter((opt) => opt && String(opt).trim() !== "")
                                      .map((opt) => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                      ))}
                                </SelectContent>
                              </Select>
                              {customValues[field.id] &&
                                /pr[ée]ciser/i.test(customValues[field.id]) && (
                                  <Input
                                    value={customValues[`${field.id}_preciser`] || ""}
                                    onChange={(e) =>
                                      setCustomValues((prev) => ({
                                        ...prev,
                                        [`${field.id}_preciser`]: e.target.value,
                                      }))
                                    }
                                    placeholder="À préciser..."
                                  />
                                )}
                            </>
                          )}
                          {isCheckbox && (
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={customValues[field.id] === "true"}
                                  onCheckedChange={() => {
                                    setCustomValues((prev) => ({ ...prev, [field.id]: "true" }));
                                    setErrors((prev) => ({ ...prev, [`custom_${field.id}`]: "" }));
                                  }}
                                />
                                <span className="text-sm">Oui</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={customValues[field.id] === "false"}
                                  onCheckedChange={() => {
                                    setCustomValues((prev) => ({ ...prev, [field.id]: "false" }));
                                    setErrors((prev) => ({ ...prev, [`custom_${field.id}`]: "" }));
                                  }}
                                />
                                <span className="text-sm">Non</span>
                              </label>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <FieldError field={`custom_${field.id}`} />
                  </div>
                ))}
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmer l'inscription
          </Button>
        </form>
      </main>

      <InscriptionFooter />
    </div>
  );
};

const InscriptionFooter = () => (
  <footer className="bg-zinc-900 text-zinc-300 mt-16">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <div className="space-y-4">
        <img src={ciExportLogo} alt="Agence CI Export" className="h-14 object-contain" />
        <p className="text-sm text-zinc-400">Agence Côte d'Ivoire Export</p>
        <div className="flex gap-3 pt-2">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
            <Facebook className="w-4 h-4 text-white" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
            <Instagram className="w-4 h-4 text-white" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
            <Twitter className="w-4 h-4 text-white" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
            <Linkedin className="w-4 h-4 text-white" />
          </a>
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

export default InscriptionForm;