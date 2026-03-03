import { Badge } from "@/components/ui/badge";

export type SessionStatus = "brouillon" | "publiee" | "en_cours" | "terminee" | "annulee";

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

const statusConfig: Record<SessionStatus, { label: string; className: string }> = {
  brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  publiee: { label: "Publiée", className: "bg-info/10 text-info" },
  en_cours: { label: "En cours", className: "bg-accent/10 text-accent" },
  terminee: { label: "Terminée", className: "bg-success/10 text-success" },
  annulee: { label: "Annulée", className: "bg-destructive/10 text-destructive" },
};

const SessionStatusBadge = ({ status }: SessionStatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={`${config.className} border-0 font-medium text-xs`}>
      {config.label}
    </Badge>
  );
};

export default SessionStatusBadge;
