import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

const Participants = () => {
  const [search, setSearch] = useState("");

  const { data: participants, isLoading } = useQuery({
    queryKey: ["admin-participants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*, participant_secteurs(secteur_id, secteurs(nom))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = participants?.filter(
    (p) =>
      `${p.nom_dirigeant} ${p.nom_entreprise} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <AdminLayout title="Participants" subtitle="Liste des participants inscrits">
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                <TableHead>Dirigeant</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Secteurs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const secteurs = (p.participant_secteurs as any[])
                  ?.map((ps: any) => ps.secteurs?.nom)
                  .filter(Boolean)
                  .join(", ") || "—";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nom_dirigeant}</TableCell>
                    <TableCell>{p.nom_entreprise}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell className="text-muted-foreground">{p.telephone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">{secteurs}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun participant trouvé.
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

export default Participants;
