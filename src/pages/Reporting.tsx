import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const COLORS = [
  "hsl(32, 95%, 44%)",
  "hsl(222, 47%, 11%)",
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 60%, 50%)",
  "hsl(180, 60%, 40%)",
  "hsl(50, 80%, 50%)",
  "hsl(340, 70%, 50%)",
];

const Reporting = () => {
  const { data: remplissage, isLoading } = useQuery({
    queryKey: ["reporting-remplissage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_taux_remplissage")
        .select("*")
        .order("date_debut", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const chartData = remplissage?.map((r) => ({
    name: (r.titre as string).slice(0, 20),
    inscrits: Number(r.inscrits),
    places: Number(r.places),
    taux: Number(r.taux_pct),
  })) ?? [];

  const themeData = remplissage?.reduce((acc, r) => {
    const theme = r.theme as string;
    const existing = acc.find((a) => a.name === theme);
    if (existing) {
      existing.value += Number(r.inscrits);
    } else {
      acc.push({ name: theme, value: Number(r.inscrits) });
    }
    return acc;
  }, [] as { name: string; value: number }[]) ?? [];

  const handleExportExcel = async () => {
    try {
      // Fetch all inscriptions with participant & formation details
      const { data: inscriptions, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .order("date_debut", { ascending: true });

      if (error) throw error;
      if (!inscriptions || inscriptions.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      // Group by formation
      const formationsMap = new Map<string, typeof inscriptions>();
      for (const row of inscriptions) {
        const key = row.formation_id ?? "unknown";
        if (!formationsMap.has(key)) formationsMap.set(key, []);
        formationsMap.get(key)!.push(row);
      }

      const wb = XLSX.utils.book_new();

      // Create a summary sheet
      const summaryRows = Array.from(formationsMap.entries()).map(([, rows]) => ({
        "Formation": rows[0].formation_titre ?? "",
        "Thème": rows[0].theme ?? "",
        "Date": rows[0].date_debut ?? "",
        "Lieu": rows[0].lieu ?? "",
        "Statut": rows[0].statut_formation ?? "",
        "Nb Inscrits": rows.length,
        "Nb Présents": rows.filter((r) => r.present).length,
      }));
      const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
      summaryWs["!cols"] = [
        { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // One sheet per formation
      for (const [, rows] of formationsMap) {
        const titre = (rows[0].formation_titre ?? "Formation").slice(0, 28);
        const sheetData = rows.map((r) => ({
          "Nom Dirigeant": r.nom_dirigeant ?? "",
          "Entreprise": r.nom_entreprise ?? "",
          "Email": r.email ?? "",
          "Téléphone": r.telephone ?? "",
          "Source": r.source ?? "",
          "Date Inscription": r.date_inscription ?? "",
          "Statut Inscription": r.statut_inscription ?? "",
          "Présent": r.present ? "Oui" : "Non",
        }));
        const ws = XLSX.utils.json_to_sheet(sheetData);
        ws["!cols"] = [
          { wch: 22 }, { wch: 25 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 10 },
        ];
        // Sanitize sheet name
        const safeName = titre.replace(/[\\/*?[\]:]/g, "");
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      }

      XLSX.writeFile(wb, `reporting-formations-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Export Excel téléchargé avec succès");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  return (
    <AdminLayout title="Reporting" subtitle="Indicateurs clés et statistiques">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleExportExcel} className="gap-2">
              <Download className="w-4 h-4" />
              Exporter en Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="stat-card">
              <h3 className="font-semibold text-foreground mb-4">Inscrits par formation</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)" }} />
                  <Bar dataKey="inscrits" fill="hsl(32, 95%, 44%)" radius={[4, 4, 0, 0]} name="Inscrits" />
                  <Bar dataKey="places" fill="hsl(222, 47%, 11%)" radius={[4, 4, 0, 0]} name="Places" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="stat-card">
              <h3 className="font-semibold text-foreground mb-4">Répartition par thème</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={themeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {themeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Reporting;
