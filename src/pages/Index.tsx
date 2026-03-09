import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle, Award, Loader2, TrendingUp, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentInscriptions } = useQuery({
    queryKey: ["recent-inscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_inscriptions")
        .select("*")
        .order("date_inscription", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const tauxPresence = stats?.total_inscrits
    ? Math.round(((stats.total_presents ?? 0) / stats.total_inscrits) * 100)
    : 0;

  return (
    <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble de l'activité Agence CI Export">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total formations</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats?.total_formations ?? 0}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">À venir</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats?.formations_a_venir ?? 0}</p>
                  <p className="text-xs text-accent font-medium mt-1">Planifiées</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-info/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-info" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Inscrits confirmés</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats?.total_inscrits ?? 0}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-success" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taux de présence</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{tauxPresence}%</p>
                  <Progress value={tauxPresence} className="mt-2 h-1.5" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming formations */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Prochaines formations</h2>
                <a href="/admin/sessions" className="text-sm text-accent hover:underline font-medium">
                  Voir tout →
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming && upcoming.length > 0 ? (
                  upcoming.map((f) => {
                    const inscrits = (f.inscriptions as any)?.[0]?.count ?? 0;
                    const tauxRemplissage = Math.min(100, Math.round((inscrits / f.places) * 100));
                    return (
                      <a key={f.id} href={`/admin/sessions/${f.id}`} className="stat-card group block">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">{f.theme}</Badge>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            tauxRemplissage >= 80 ? "bg-destructive/10 text-destructive" : 
                            tauxRemplissage >= 50 ? "bg-warning/10 text-warning" : 
                            "bg-success/10 text-success"
                          }`}>
                            {tauxRemplissage}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 text-base">
                          {f.titre}
                        </h3>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(f.date_debut), "d MMMM yyyy", { locale: fr })}
                          </div>
                          {f.lieu && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              {f.lieu}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            {inscrits}/{f.places} inscrits
                          </div>
                        </div>
                        <Progress value={tauxRemplissage} className="mt-3 h-1.5" />
                      </a>
                    );
                  })
                ) : (
                  <div className="stat-card text-center py-8 md:col-span-2">
                    <p className="text-muted-foreground">Aucune formation à venir.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent inscriptions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Dernières inscriptions</h2>
                <a href="/admin/participants" className="text-sm text-accent hover:underline font-medium">
                  Voir tout →
                </a>
              </div>
              <div className="stat-card divide-y divide-border">
                {recentInscriptions && recentInscriptions.length > 0 ? (
                  recentInscriptions.map((ins, i) => (
                    <div key={i} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-foreground text-sm">{ins.nom_dirigeant}</p>
                      <p className="text-xs text-muted-foreground">{ins.nom_entreprise}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-accent truncate max-w-[60%]">{ins.formation_titre}</p>
                        <span className="text-xs text-muted-foreground">
                          {ins.date_inscription ? format(new Date(ins.date_inscription), "dd/MM", { locale: fr }) : ""}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">Aucune inscription récente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
