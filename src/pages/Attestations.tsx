import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Award, Loader2 } from "lucide-react";

const Attestations = () => {
  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ["attestations-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .not("present", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const presents = inscriptions?.filter((i) => i.present === true) ?? [];

  return (
    <AdminLayout title="Attestations" subtitle="Participants ayant validé leur présence">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="stat-card text-center py-4">
          <Award className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{presents.length}</p>
          <p className="text-xs text-muted-foreground">Présences validées</p>
        </div>
        <div className="stat-card text-center py-4">
          <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{(inscriptions?.length ?? 0) - presents.length}</p>
          <p className="text-xs text-muted-foreground">Non validées</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="stat-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Participant</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Formation</TableHead>
                <TableHead>Thème</TableHead>
                <TableHead>Présence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscriptions?.map((i) => (
                <TableRow key={i.inscription_id}>
                  <TableCell className="font-medium">{i.nom_dirigeant}</TableCell>
                  <TableCell>{i.nom_entreprise}</TableCell>
                  <TableCell className="max-w-48 truncate">{i.formation_titre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                      {i.theme}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {i.present ? (
                      <span className="flex items-center gap-1.5 text-success text-sm font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Présent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Clock className="w-3.5 h-3.5" /> Absent
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!inscriptions || inscriptions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune donnée de présence disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default Attestations;
