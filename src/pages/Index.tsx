import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import SessionCard from "@/components/SessionCard";
import { sessions, kpis } from "@/lib/mock-data";
import { Calendar, Users, CheckCircle, Award, TrendingUp, Clock } from "lucide-react";

const Dashboard = () => {
  const upcomingSessions = sessions
    .filter((s) => s.statut === "publiee")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble de l'activité">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Sessions planifiées"
          value={kpis.sessionsAVenir}
          change="+2 ce mois"
          changeType="positive"
          icon={Calendar}
        />
        <StatCard
          label="Inscrits totaux"
          value={kpis.totalInscrits}
          change="+15% vs mois dernier"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          label="Taux de présence"
          value={`${kpis.tauxPresence}%`}
          change="Objectif : 95%"
          changeType="neutral"
          icon={CheckCircle}
        />
        <StatCard
          label="Attestations générées"
          value={kpis.attestationsGenerees}
          change="18 ce trimestre"
          changeType="neutral"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Prochaines sessions</h2>
            <a href="/sessions" className="text-sm text-accent hover:underline font-medium">
              Voir tout →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Activité récente</h2>
          <div className="stat-card space-y-4">
            {[
              { text: "Karim Benali s'est inscrit à \"Fondamentaux de l'export\"", time: "Il y a 2h", icon: Users },
              { text: "Session \"Financement export\" terminée – 18/20 présents", time: "Il y a 1j", icon: CheckCircle },
              { text: "3 attestations générées automatiquement", time: "Il y a 1j", icon: Award },
              { text: "Rappel J-2 envoyé pour \"Réglementation douanière\"", time: "Il y a 2j", icon: Clock },
              { text: "Nouvelle session \"Marketing digital\" créée", time: "Il y a 3j", icon: TrendingUp },
            ].map((activity, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <activity.icon className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
