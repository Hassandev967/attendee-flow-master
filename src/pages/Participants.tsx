import AdminLayout from "@/components/AdminLayout";
import ImportParticipantsDialog from "@/components/ImportParticipantsDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronDown, ChevronRight, Users, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const Participants = () => {
  const [search, setSearch] = useState("");
  const [openFormations, setOpenFormations] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ["admin-participants-by-formation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: participantSecteurs } = useQuery({
    queryKey: ["participant-secteurs-for-export"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_secteurs")
        .select("participant_id, secteurs(nom)");
      if (error) throw error;
      return data;
    },
  });

  const getSecteurs = (participantId: string | null) => {
    if (!participantId || !participantSecteurs) return "";
    return participantSecteurs
      .filter((ps) => ps.participant_id === participantId)
      .map((ps) => (ps.secteurs as any)?.nom ?? "")
      .filter(Boolean)
      .join(", ");
  };

  const filtered = inscriptions?.filter(
    (i) =>
      `${i.nom_dirigeant} ${i.nom_entreprise} ${i.email} ${i.formation_titre}`.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  // Group by formation
  const grouped = filtered.reduce<Record<string, { titre: string; theme: string; date_debut: string | null; lieu: string | null; statut: string | null; participants: typeof filtered }>>((acc, i) => {
    const key = i.formation_id || "unknown";
    if (!acc[key]) {
      acc[key] = {
        titre: i.formation_titre || "Sans titre",
        theme: i.theme || "",
        date_debut: i.date_debut,
        lieu: i.lieu,
        statut: i.statut_formation,
        participants: [],
      };
    }
    acc[key].participants.push(i);
    return acc;
  }, {});

  const toggleFormation = (id: string) => {
    setOpenFormations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statutColor = (statut: string | null) => {
    switch (statut) {
      case "A venir": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "En cours": return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "Terminée": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleDelete = async (inscriptionId: string) => {
    setDeleting(inscriptionId);
    try {
      // Delete presence first (foreign key)
      await supabase.from("presences").delete().eq("inscription_id", inscriptionId);
      // Then delete inscription
      const { error } = await supabase.from("inscriptions").delete().eq("id", inscriptionId);
      if (error) throw error;
      toast.success("Participant supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-participants-by-formation"] });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (!filtered.length) {
      toast.error("Aucun participant à exporter");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Global sheet with all participants
    const allData = filtered.map((p) => ({
      "Formation": p.formation_titre ?? "",
      "Thème": p.theme ?? "",
      "Date": p.date_debut ?? "",
      "Lieu": p.lieu ?? "",
      "Nom Dirigeant": p.nom_dirigeant ?? "",
      "Entreprise": p.nom_entreprise ?? "",
      "Email": p.email ?? "",
      "Téléphone": p.telephone ?? "",
      "Secteur d'activité": getSecteurs(p.participant_id),
      "Source": p.source ?? "",
      "Statut Inscription": p.statut_inscription ?? "",
      "Présent": p.present === true ? "Oui" : p.present === false ? "Non" : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(allData);
    ws["!cols"] = [
      { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
      { wch: 22 }, { wch: 25 }, { wch: 28 }, { wch: 16 },
      { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Tous les participants");

    // One sheet per formation
    for (const [, group] of Object.entries(grouped)) {
      const sheetData = group.participants.map((p) => ({
        "Nom Dirigeant": p.nom_dirigeant ?? "",
        "Entreprise": p.nom_entreprise ?? "",
        "Email": p.email ?? "",
        "Téléphone": p.telephone ?? "",
        "Secteur d'activité": getSecteurs(p.participant_id),
        "Source": p.source ?? "",
        "Statut": p.statut_inscription ?? "",
        "Présent": p.present === true ? "Oui" : p.present === false ? "Non" : "—",
      }));
      const sheetWs = XLSX.utils.json_to_sheet(sheetData);
      sheetWs["!cols"] = [
        { wch: 22 }, { wch: 25 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
      ];
      const safeName = (group.titre).slice(0, 28).replace(/[\\/*?[\]:]/g, "");
      XLSX.utils.book_append_sheet(wb, sheetWs, safeName);
    }

    XLSX.writeFile(wb, `participants-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Export Excel téléchargé");
  };

  return (
    <AdminLayout title="Participants" subtitle="Liste des participants inscrits par formation">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un participant ou une formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ImportParticipantsDialog />
          <Button onClick={handleExportExcel} variant="outline" className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            Exporter en Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          Aucun participant trouvé.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([formationId, group]) => {
            const isOpen = openFormations.has(formationId);
            return (
              <Collapsible key={formationId} open={isOpen} onOpenChange={() => toggleFormation(formationId)}>
                <CollapsibleTrigger asChild>
                  <button className="stat-card w-full flex items-center gap-4 p-4 text-left hover:bg-accent/50 transition-colors cursor-pointer">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{group.titre}</span>
                        <Badge variant="outline" className={statutColor(group.statut)}>
                          {group.statut}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>{group.theme}</span>
                        {group.date_debut && (
                          <span>{format(new Date(group.date_debut), "d MMM yyyy", { locale: fr })}</span>
                        )}
                        {group.lieu && <span>{group.lieu}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{group.participants.length}</span>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="stat-card overflow-hidden p-0 mt-1 ml-8">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Dirigeant</TableHead>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Présence</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.participants.map((p) => (
                          <TableRow key={p.inscription_id}>
                            <TableCell className="font-medium">{p.nom_dirigeant}</TableCell>
                            <TableCell>{p.nom_entreprise}</TableCell>
                            <TableCell className="text-muted-foreground">{p.email}</TableCell>
                            <TableCell className="text-muted-foreground">{p.telephone || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {p.statut_inscription}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {p.present === true ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200" variant="outline">Présent</Badge>
                              ) : p.present === false ? (
                                <Badge className="bg-red-500/10 text-red-600 border-red-200" variant="outline">Absent</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    disabled={deleting === p.inscription_id}
                                  >
                                    {deleting === p.inscription_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer ce participant ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Vous êtes sur le point de supprimer l'inscription de <strong>{p.nom_dirigeant}</strong> ({p.nom_entreprise}) de la formation <strong>{group.titre}</strong>. Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(p.inscription_id!)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default Participants;
