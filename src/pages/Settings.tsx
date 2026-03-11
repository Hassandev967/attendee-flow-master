import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Building2, Mail, Bell, Shield, Loader2, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type SettingsMap = Record<string, string>;

const DEFAULTS: SettingsMap = {
  org_nom: "",
  org_email: "",
  org_telephone: "",
  org_adresse: "",
  notif_confirmation: "true",
  notif_rappel_j2: "true",
  notif_rappel_j1: "true",
  notif_post_session: "true",
  notif_attestations: "true",
  email_expediteur: "",
  email_nom_affichage: "",
  securite_2fa: "false",
  securite_journalisation: "true",
};

const Settings = () => {
  const [settings, setSettings] = useState<SettingsMap>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("key, value");
      if (data) {
        const map: SettingsMap = { ...DEFAULTS };
        data.forEach((r: { key: string; value: string }) => {
          map[r.key] = r.value;
        });
        setSettings(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBool = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(settings);
    // Upsert each setting
    const { error } = await supabase.from("settings").upsert(
      entries.map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() })),
      { onConflict: "key" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les paramètres.", variant: "destructive" });
    } else {
      toast({ title: "Paramètres sauvegardés", description: "Vos modifications ont été enregistrées." });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Paramètres" subtitle="Configuration de la plateforme">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Paramètres" subtitle="Configuration de la plateforme">
      <div className="max-w-2xl space-y-8">
        {/* Organisation */}
        <div className="stat-card">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-accent" />
            Organisation
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'organisation</Label>
              <Input value={settings.org_nom} onChange={(e) => update("org_nom", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email de contact</Label>
                <Input value={settings.org_email} onChange={(e) => update("org_email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={settings.org_telephone} onChange={(e) => update("org_telephone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={settings.org_adresse} onChange={(e) => update("org_adresse", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="stat-card">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-accent" />
            Notifications automatiques
          </h3>
          <div className="space-y-4">
            {[
              { key: "notif_confirmation", label: "Confirmation d'inscription", desc: "Email + SMS envoyé après inscription" },
              { key: "notif_rappel_j2", label: "Rappel J-2", desc: "Email de rappel 2 jours avant la session" },
              { key: "notif_rappel_j1", label: "Rappel J-1", desc: "Email + SMS la veille de la session" },
              { key: "notif_post_session", label: "Post-session", desc: "Remerciements + enquête J+1" },
              { key: "notif_attestations", label: "Envoi automatique des attestations", desc: "Génère et envoie l'attestation après validation de la présence" },
            ].map((item, i, arr) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={settings[item.key] === "true"} onCheckedChange={() => toggleBool(item.key)} />
                </div>
                {i < arr.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="stat-card">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-accent" />
            Configuration email
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email expéditeur</Label>
              <Input value={settings.email_expediteur} onChange={(e) => update("email_expediteur", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nom d'affichage</Label>
              <Input value={settings.email_nom_affichage} onChange={(e) => update("email_nom_affichage", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="stat-card">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-accent" />
            Sécurité
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Authentification à deux facteurs</p>
                <p className="text-xs text-muted-foreground">Renforce la sécurité des comptes administrateurs</p>
              </div>
              <Switch checked={settings.securite_2fa === "true"} onCheckedChange={() => toggleBool("securite_2fa")} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Journalisation des accès</p>
                <p className="text-xs text-muted-foreground">Enregistre les connexions et actions admin</p>
              </div>
              <Switch checked={settings.securite_journalisation === "true"} onCheckedChange={() => toggleBool("securite_journalisation")} />
            </div>
          </div>
        </div>

        {/* Changer mon mot de passe */}
        <ChangePasswordSection />

        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Sauvegarder les paramètres
        </Button>
      </div>
    </AdminLayout>
  );
};

export default Settings;
