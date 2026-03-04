import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle, Award, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_stats_dashboard")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-formations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formations")
        .select("*, inscriptions(count)")
        .eq("statut", "A venir")
        .order("date_debut", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble de l'activité ACIEX">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total formations"
              value={stats?.total_formations ?? 0}
              icon={Calendar}
            />
            <StatCard
              label="Formations à venir"
              value={stats?.formations_a_venir ?? 0}
              icon={Calendar}
              change="Planifiées"
              changeType="neutral"
            />
            <StatCard
              label="Inscrits confirmés"
              value={stats?.total_inscrits ?? 0}
              icon={Users}
            />
            <StatCard
              label="Participants"
              value={stats?.total_participants ?? 0}
              icon={Award}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Prochaines formations</h2>
              <a href="/sessions" className="text-sm text-accent hover:underline font-medium">
                Voir tout →
              </a>
            </div>
            {upcoming && upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((f) => {
                  const inscrits = (f.inscriptions as any)?.[0]?.count ?? 0;
                  return (
                    <a key={f.id} href={`/sessions/${f.id}`} className="stat-card group">
                      <span className="text-xs font-medium text-accent uppercase tracking-wide">{f.theme}</span>
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 mt-1">
                        {f.titre}
                      </h3>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(f.date_debut).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {inscrits}/{f.places}
                        </span>
                      </div>
                      <div className="mt-3 w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-accent h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (inscrits / f.places) * 100)}%` }}
                        />
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="stat-card text-center py-8">
                <p className="text-muted-foreground">Aucune formation à venir.</p>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
