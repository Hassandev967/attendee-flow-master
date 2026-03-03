import AdminLayout from "@/components/AdminLayout";
import SessionCard from "@/components/SessionCard";
import { sessions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { useState } from "react";
import { SessionStatus } from "@/components/SessionStatusBadge";

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

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.statut === filter);

  return (
    <AdminLayout title="Sessions" subtitle="Gérez vos sessions de formation">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
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
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune session trouvée pour ce filtre.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default Sessions;
