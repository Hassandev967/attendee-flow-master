import { Session } from "@/lib/mock-data";
import SessionStatusBadge from "./SessionStatusBadge";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SessionCardProps {
  session: Session;
}

const SessionCard = ({ session }: SessionCardProps) => {
  const navigate = useNavigate();

  return (
    <div
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
          {format(new Date(session.date), "d MMMM yyyy, HH:mm", { locale: fr })}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          {session.lieu}
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          {session.inscrits}/{session.places} inscrits
        </div>
      </div>
      <div className="mt-4 w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-accent h-1.5 rounded-full transition-all"
          style={{ width: `${Math.min(100, (session.inscrits / session.places) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default SessionCard;
