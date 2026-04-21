import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Emargement = () => {
  const [selectedFormation, setSelectedFormation] = useState<string>("");

  const { data: formations } = useQuery({
    queryKey: ["emargement-formations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("id, titre, statut")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inscriptions, isLoading, refetch } = useQuery({
    queryKey: ["emargement-inscriptions", selectedFormation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .eq("formation_id", selectedFormation);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFormation,
  });

  const handleMarquerPresent = async (inscriptionId: string) => {
    const { error } = await supabase.from("presences").upsert({
      inscription_id: inscriptionId,
      present: true,
      enregistre_le: new Date().toISOString(),
    }, { onConflict: "inscription_id" });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Présence enregistrée" });
      refetch();
    }
  };

  const presents = inscriptions?.filter((i) => i.present === true).length ?? 0;
  const total = inscriptions?.length ?? 0;
  const tauxPresence = total > 0 ? Math.round((presents / total) * 100) : 0;

  return (
    <AdminLayout title="Émargement" subtitle="Suivi de présence">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 space-y-4">
          <div className="stat-card">
            <label className="text-sm font-medium text-foreground mb-2 block">Formation</label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une formation" /></SelectTrigger>
              <SelectContent>
                {formations?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.titre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFormation && (
            <div className="stat-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Taux de présence</p>
              <p className="text-4xl font-bold text-foreground">{tauxPresence}%</p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-3">
                <div
                  className="bg-accent h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${tauxPresence}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{presents} présents</span>
                <span>{total} inscrits</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          {!selectedFormation ? (
            <div className="stat-card text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Sélectionnez une formation pour voir les inscrits.</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="stat-card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Liste des inscrits
                </h3>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  {presents}/{total}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Participant</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscriptions?.map((i) => (
                    <TableRow key={i.inscription_id}>
                      <TableCell className="font-medium">{i.nom_dirigeant}</TableCell>
                      <TableCell>{i.nom_entreprise}</TableCell>
                      <TableCell className="text-muted-foreground">{i.email}</TableCell>
                      <TableCell>
                        {i.present ? (
                          <span className="flex items-center gap-1.5 text-success text-sm font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Présent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="w-3.5 h-3.5" /> En attente
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!i.present && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarquerPresent(i.inscription_id as string)}
                            className="text-xs"
                          >
                            Émarger
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {inscriptions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun inscrit pour cette formation.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Emargement;
