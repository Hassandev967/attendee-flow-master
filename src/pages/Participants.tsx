import AdminLayout from "@/components/AdminLayout";
import { participants } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const niveauLabels = {
  debutant: { label: "Débutant", className: "bg-info/10 text-info" },
  intermediaire: { label: "Intermédiaire", className: "bg-accent/10 text-accent" },
  confirme: { label: "Confirmé", className: "bg-success/10 text-success" },
};

const Participants = () => {
  const [search, setSearch] = useState("");
  const filtered = participants.filter(
    (p) =>
      `${p.nom} ${p.prenom} ${p.entreprise} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="stat-card overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Niveau export</TableHead>
              <TableHead>Inscription</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.prenom} {p.nom}</TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                <TableCell>{p.entreprise}</TableCell>
                <TableCell className="text-muted-foreground">{p.secteur}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${niveauLabels[p.niveauExport].className} border-0 text-xs`}>
                    {niveauLabels[p.niveauExport].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.dateInscription}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Participants;
