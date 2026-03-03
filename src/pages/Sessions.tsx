import AdminLayout from "@/components/AdminLayout";
import SessionStatusBadge from "@/components/SessionStatusBadge";
import CreateSessionDialog from "@/components/CreateSessionDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Filter, Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { SessionStatus } from "@/components/SessionStatusBadge";

const statusFilters: { label: string; value: SessionStatus | "all" }[] = [
  { label: "Toutes", value: "all" },
  { label: "Publiées", value: "publiee" },
  { label: "En cours", value: "en_cours" },
  { label: "Terminées", value: "terminee" },
  { label: "Brouillons", value: "brouillon" },
  { label: "Annulées", value: "annulee" },
];

const Sessions = () => {
  const [filter, setFilter] = useState<SessionStatus | "all">("all");
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, inscriptions(count)")
        .order("date_session", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = sessions
    ? filter === "all"
      ? sessions
      : sessions.filter((s) => s.statut === filter)
    : [];

  return (
    <AdminLayout title="Sessions" subtitle="Gérez vos sessions de formation">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <CreateSessionDialog />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((session) => {
            const inscrits = (session.inscriptions as any)?.[0]?.count ?? 0;
            return (
              <div
                key={session.id}
                onClick={() => navigate(`/sessions/${session.id}`)}
                className="stat-card cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-accent uppercase tracking-wide">
                    {session.thematique}
                  </span>
                  <SessionStatusBadge status={session.statut} />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                  {session.titre}
                </h3>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(session.date_session), "d MMMM yyyy, HH:mm", { locale: fr })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {session.lieu}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    {inscrits}/{session.places} inscrits
                  </div>
                </div>
                <div className="mt-4 w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (inscrits / session.places) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune session trouvée.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default Sessions;
