import { SessionStatus } from "@/components/SessionStatusBadge";

export interface Intervenant {
  id: string;
  nom: string;
  titre: string;
  organisation: string;
  bio: string;
  photo?: string;
}

export interface Session {
  id: string;
  titre: string;
  thematique: string;
  date: string;
  horaire: string;
  lieu: string;
  intervenants: Intervenant[];
  places: number;
  inscrits: number;
  presents: number;
  statut: SessionStatus;
  description: string;
  mode: "presentiel" | "en_ligne" | "hybride";
}

export interface Participant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  entreprise: string;
  secteur: string;
  taille: string;
  fonction: string;
  niveauExport: "debutant" | "intermediaire" | "confirme";
  dateInscription: string;
}

export const intervenants: Intervenant[] = [
  {
    id: "1",
    nom: "Marie Dupont",
    titre: "Directrice Export",
    organisation: "CCI France",
    bio: "Experte en développement international avec 15 ans d'expérience.",
  },
  {
    id: "2",
    nom: "Jean-Pierre Martin",
    titre: "Consultant Commerce International",
    organisation: "Business France",
    bio: "Spécialiste des marchés émergents et du commerce transfrontalier.",
  },
  {
    id: "3",
    nom: "Aïcha Benaïssa",
    titre: "Responsable Douanes & Logistique",
    organisation: "Groupe Logistiq",
    bio: "Expert en réglementation douanière et chaîne logistique internationale.",
  },
];

export const sessions: Session[] = [
  {
    id: "1",
    titre: "Les fondamentaux de l'export : premiers pas à l'international",
    thematique: "Export",
    date: "2026-03-15T09:00:00",
    horaire: "09:00 - 12:00",
    lieu: "Salle Conférence A - VDE",
    intervenants: [intervenants[0]],
    places: 30,
    inscrits: 24,
    presents: 0,
    statut: "publiee",
    description: "Session d'initiation aux fondamentaux de l'exportation pour les entreprises souhaitant se lancer à l'international.",
    mode: "hybride",
  },
  {
    id: "2",
    titre: "Réglementation douanière et certifications",
    thematique: "Réglementation",
    date: "2026-03-22T14:00:00",
    horaire: "14:00 - 17:00",
    lieu: "Salle Conférence B - VDE",
    intervenants: [intervenants[2]],
    places: 25,
    inscrits: 18,
    presents: 0,
    statut: "publiee",
    description: "Tout savoir sur les procédures douanières, les certifications requises et les normes internationales.",
    mode: "presentiel",
  },
  {
    id: "3",
    titre: "Stratégies de pénétration des marchés africains",
    thematique: "Marchés",
    date: "2026-04-05T09:30:00",
    horaire: "09:30 - 12:30",
    lieu: "Amphithéâtre - VDE",
    intervenants: [intervenants[1]],
    places: 50,
    inscrits: 42,
    presents: 0,
    statut: "publiee",
    description: "Analyse approfondie des marchés africains et stratégies d'entrée pour les PME.",
    mode: "hybride",
  },
  {
    id: "4",
    titre: "Financement et assurance à l'export",
    thematique: "Finance",
    date: "2026-02-20T09:00:00",
    horaire: "09:00 - 16:00",
    lieu: "Salle Conférence A - VDE",
    intervenants: [intervenants[0], intervenants[1]],
    places: 20,
    inscrits: 20,
    presents: 18,
    statut: "terminee",
    description: "Dispositifs de financement et solutions d'assurance pour sécuriser vos opérations export.",
    mode: "presentiel",
  },
  {
    id: "5",
    titre: "Marketing digital pour l'export",
    thematique: "Marketing",
    date: "2026-04-18T14:00:00",
    horaire: "14:00 - 17:00",
    lieu: "En ligne",
    intervenants: [intervenants[0]],
    places: 40,
    inscrits: 12,
    presents: 0,
    statut: "brouillon",
    description: "Utiliser le marketing digital pour développer sa présence à l'international.",
    mode: "en_ligne",
  },
];

export const participants: Participant[] = [
  {
    id: "1",
    nom: "Benali",
    prenom: "Karim",
    email: "k.benali@entreprise.com",
    telephone: "+33612345678",
    entreprise: "TechExport SAS",
    secteur: "Technologie",
    taille: "PME (10-50)",
    fonction: "Directeur Commercial",
    niveauExport: "intermediaire",
    dateInscription: "2026-02-15",
  },
  {
    id: "2",
    nom: "Laurent",
    prenom: "Sophie",
    email: "s.laurent@agriplus.fr",
    telephone: "+33698765432",
    entreprise: "AgriPlus SARL",
    secteur: "Agroalimentaire",
    taille: "TPE (<10)",
    fonction: "Gérante",
    niveauExport: "debutant",
    dateInscription: "2026-02-18",
  },
  {
    id: "3",
    nom: "Diallo",
    prenom: "Fatou",
    email: "f.diallo@textilux.com",
    telephone: "+33645678901",
    entreprise: "Textilux SA",
    secteur: "Textile",
    taille: "ETI (50-250)",
    fonction: "Responsable Export",
    niveauExport: "confirme",
    dateInscription: "2026-02-20",
  },
];

export const kpis = {
  totalSessions: sessions.length,
  sessionsAVenir: sessions.filter((s) => s.statut === "publiee").length,
  totalInscrits: sessions.reduce((acc, s) => acc + s.inscrits, 0),
  tauxPresence: 90,
  totalParticipants: participants.length,
  attestationsGenerees: 18,
};
