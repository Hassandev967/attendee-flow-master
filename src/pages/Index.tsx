import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle, Award, Loader2, TrendingUp, Clock, MapPin, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_stats_dashboard").select("*").single();
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

  const statItems = [
    {
      label: "Total formations",
      value: stats?.total_formations ?? 0,
      icon: Calendar,
      color: "bg-accent/10 text-accent",
    },
    {
      label: "À venir",
      value: stats?.formations_a_venir ?? 0,
      icon: Clock,
      color: "bg-info/10 text-info",
      sub: "Planifiées",
    },
    {
      label: "Inscrits confirmés",
      value: stats?.total_inscrits ?? 0,
      icon: Users,
      color: "bg-success/10 text-success",
    },
    {
      label: "Taux de présence",
      value: `${tauxPresence}%`,
      icon: TrendingUp,
      color: "bg-warning/10 text-warning",
      progress: tauxPresence,
    },
  ];

  return (
    <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble de l'activité">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {statItems.map((item) => (
              <div key={item.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-3xl font-bold text-foreground tracking-tight">{item.value}</p>
                    {item.sub && <p className="text-xs text-accent font-medium">{item.sub}</p>}
                    {item.progress !== undefined && <Progress value={item.progress} className="mt-2 h-1.5" />}
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming formations */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Prochaines formations</h2>
                <a href="/admin/sessions" className="text-xs text-accent hover:underline font-medium flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                {upcoming && upcoming.length > 0 ? (
                  upcoming.map((f) => {
                    const inscrits = (f.inscriptions as any)?.[0]?.count ?? 0;
                    const tauxRemplissage = Math.min(100, Math.round((inscrits / f.places) * 100));
                    return (
                      <a key={f.id} href={`/admin/sessions/${f.id}`} className="stat-card group block">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">{f.theme}</Badge>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tauxRemplissage >= 80 ? "bg-destructive/10 text-destructive" :
                            tauxRemplissage >= 50 ? "bg-warning/10 text-warning" :
                            "bg-success/10 text-success"
                          }`}>
                            {tauxRemplissage}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 text-sm">
                          {f.titre}
                        </h3>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {format(new Date(f.date_debut), "d MMMM yyyy", { locale: fr })}
                          </div>
                          {f.lieu && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {f.lieu}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            {inscrits}/{f.places} inscrits
                          </div>
                        </div>
                        <Progress value={tauxRemplissage} className="mt-3 h-1" />
                      </a>
                    );
                  })
                ) : (
                  <div className="stat-card text-center py-8 md:col-span-2">
                    <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune formation à venir.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent inscriptions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Dernières inscriptions</h2>
                <a href="/admin/participants" className="text-xs text-accent hover:underline font-medium flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
              <div className="stat-card divide-y divide-border/50 p-0">
                {recentInscriptions && recentInscriptions.length > 0 ? (
                  recentInscriptions.map((ins, i) => (
                    <div key={i} className="px-5 py-3.5 first:pt-4 last:pb-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{ins.nom_dirigeant}</p>
                          <p className="text-xs text-muted-foreground truncate">{ins.nom_entreprise}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded">
                          {ins.date_inscription ? format(new Date(ins.date_inscription), "dd/MM", { locale: fr }) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-accent truncate mt-1">{ins.formation_titre}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-muted-foreground">Aucune inscription récente.</p>
                  </div>
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
