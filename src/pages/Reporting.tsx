import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2 } from "lucide-react";

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

  return (
    <AdminLayout title="Reporting" subtitle="Indicateurs clés et statistiques">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
      )}
    </AdminLayout>
  );
};

export default Reporting;
