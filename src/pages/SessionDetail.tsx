import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Link as LinkIcon, Loader2, User, Trash2, Mail, Phone, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import EditSessionDialog from "@/components/EditSessionDialog";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SUPERADMIN_EMAILS = ["t.coulibaly@cotedivoirexport.ci", "h.cisse@cotedivoirexport.ci"];

const statusColors: Record<string, string> = {
  "A venir": "bg-info/10 text-info",
  "En cours": "bg-accent/10 text-accent",
  "Terminée": "bg-success/10 text-success",
  "Annulée": "bg-destructive/10 text-destructive",
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.email ? SUPERADMIN_EMAILS.includes(user.email) : false;

  const deleteFormation = useMutation({
    mutationFn: async () => {
      await supabase.from("inscriptions").delete().eq("formation_id", id!);
      await supabase.from("event_participants").delete().eq("formation_id", id!);
      const { error } = await supabase.from("formations").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-formations"] });
      toast({ title: "Formation supprimée" });
      navigate("/admin/sessions");
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const { data: formation, isLoading } = useQuery({
    queryKey: ["formation-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count), event_participants(count)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isEvent = formation?.type === "evenement";

  const { data: participants } = useQuery({
    queryKey: ["formation-participants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .eq("formation_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !isEvent,
  });

  const { data: eventParticipants } = useQuery({
    queryKey: ["event-participants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_participants")
        .select("*")
        .eq("formation_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id && isEvent,
  });

  if (isLoading) {
    return (
      <AdminLayout title="Chargement...">
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!formation) {
    return (
      <AdminLayout title="Formation introuvable">
        <p className="text-muted-foreground">Cette formation n'existe pas.</p>
      </AdminLayout>
    );
  }

  const inscrits = isEvent
    ? ((formation.event_participants as any)?.[0]?.count ?? 0)
    : ((formation.inscriptions as any)?.[0]?.count ?? 0);
  const tauxRemplissage = formation.places > 0 ? Math.round((inscrits / formation.places) * 100) : 0;
  const inscriptionUrl = `${window.location.origin}/inscription/${formation.id}`;

  return (
    <AdminLayout title={formation.titre} subtitle={formation.theme}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette formation ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    « {formation.titre} » sera définitivement supprimée avec toutes ses inscriptions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteFormation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <EditSessionDialog formation={{
            id: formation.id,
            titre: formation.titre,
            theme: formation.theme,
            date_debut: formation.date_debut,
            duree: formation.duree,
            lieu: formation.lieu,
            formateur: formation.formateur,
            places: formation.places,
            statut: formation.statut,
            image_url: (formation as any).image_url,
            type: formation.type || "formation",
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Image de la formation */}
          {(formation as any).image_url && (
            <div className="w-36 h-36 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center mb-2">
              <img
                src={(formation as any).image_url}
                alt={formation.titre}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className={`${statusColors[formation.statut] || ""} border-0 font-medium text-xs`}>
                {formation.statut}
              </Badge>
              {isEvent && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0 font-medium text-xs">
                  🎪 Événement
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{format(new Date(formation.date_debut), "EEEE d MMMM yyyy", { locale: fr })}</span>
              </div>
              {formation.duree && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{formation.duree}</span>
                </div>
              )}
              {formation.lieu && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{formation.lieu}</span>
                </div>
              )}
              {formation.formateur && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-accent" />
                  <span>{formation.formateur}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-accent" />
                <span>{inscrits}/{formation.places} inscrits</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-accent" />
              Lien d'inscription
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg text-foreground break-all">
                {inscriptionUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(inscriptionUrl)}
              >
                Copier
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="stat-card text-center">
            <p className="text-sm text-muted-foreground mb-1">Taux de remplissage</p>
            <p className="text-3xl font-bold text-foreground">{tauxRemplissage}%</p>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: `${Math.min(100, tauxRemplissage)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formation.places - inscrits} places restantes
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={() => window.open(inscriptionUrl, "_blank")}>
            Voir formulaire d'inscription
          </Button>
        </div>
      </div>

      {/* Liste des participants */}
      {isEvent ? (
        <div className="stat-card mt-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Participants inscrits ({eventParticipants?.length ?? 0})
          </h3>
          {eventParticipants && eventParticipants.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventParticipants.map((p) => {
                    const catLabel: Record<string, string> = {
                      entreprise: "Entreprise",
                      talent: "Talent",
                      jeune: "Jeune",
                    };
                    const catColor: Record<string, string> = {
                      entreprise: "bg-amber-100 text-amber-800",
                      talent: "bg-purple-100 text-purple-800",
                      jeune: "bg-emerald-100 text-emerald-800",
                    };
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${catColor[p.categorie] || ""} border-0`}>
                            {catLabel[p.categorie] || p.categorie}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{p.nom}</TableCell>
                        <TableCell>{p.prenom}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {p.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.telephone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              {p.telephone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.entreprise && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {p.entreprise}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.categorie === "entreprise" && p.fonction}
                          {p.categorie === "talent" && p.pays_origine && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {p.pays_origine}
                            </div>
                          )}
                          {p.categorie === "jeune" && p.niveau_etude}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun participant inscrit pour cet événement.</p>
          )}
        </div>
      ) : (
        <div className="stat-card mt-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Participants inscrits ({participants?.length ?? 0})
          </h3>
          {participants && participants.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du dirigeant</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Présence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.inscription_id}>
                      <TableCell className="font-medium">{p.nom_dirigeant}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {p.nom_entreprise}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          {p.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.telephone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {p.telephone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{p.source || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {p.statut_inscription}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${p.present ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {p.present ? "Présent" : "Non enregistré"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun participant inscrit pour cette formation.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default SessionDetail;
