
-- Enum types
CREATE TYPE public.session_statut AS ENUM ('brouillon', 'publiee', 'en_cours', 'terminee', 'annulee');
CREATE TYPE public.session_mode AS ENUM ('presentiel', 'en_ligne', 'hybride');
CREATE TYPE public.niveau_export AS ENUM ('debutant', 'intermediaire', 'confirme');
CREATE TYPE public.notification_type AS ENUM ('confirmation', 'rappel_j2', 'rappel_j1', 'post_session', 'annulation');
CREATE TYPE public.notification_statut AS ENUM ('envoye', 'en_attente', 'echoue');
CREATE TYPE public.emargement_mode AS ENUM ('qr_code', 'lien_en_ligne');

-- Intervenants
CREATE TABLE public.intervenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  titre TEXT NOT NULL,
  organisation TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  thematique TEXT NOT NULL,
  description TEXT,
  date_session TIMESTAMPTZ NOT NULL,
  horaire TEXT NOT NULL,
  lieu TEXT NOT NULL,
  places INTEGER NOT NULL DEFAULT 30,
  statut session_statut NOT NULL DEFAULT 'brouillon',
  mode session_mode NOT NULL DEFAULT 'presentiel',
  lien_visio TEXT,
  lien_replay TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Session-Intervenant junction
CREATE TABLE public.session_intervenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  intervenant_id UUID NOT NULL REFERENCES public.intervenants(id) ON DELETE CASCADE,
  UNIQUE(session_id, intervenant_id)
);

-- Participants
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  secteur TEXT NOT NULL,
  taille TEXT NOT NULL,
  fonction TEXT NOT NULL,
  niveau_export niveau_export NOT NULL DEFAULT 'debutant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inscriptions
CREATE TABLE public.inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  mode_participation session_mode NOT NULL DEFAULT 'presentiel',
  qr_code TEXT,
  annulee BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, participant_id)
);

-- Émargements
CREATE TABLE public.emargements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  horodatage TIMESTAMPTZ NOT NULL DEFAULT now(),
  mode emargement_mode NOT NULL DEFAULT 'qr_code',
  UNIQUE(inscription_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  destinataire_email TEXT NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  canal TEXT NOT NULL DEFAULT 'Email',
  contenu TEXT,
  statut notification_statut NOT NULL DEFAULT 'en_attente',
  date_envoi TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attestations
CREATE TABLE public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  generee BOOLEAN NOT NULL DEFAULT false,
  date_generation TIMESTAMPTZ,
  envoyee BOOLEAN NOT NULL DEFAULT false,
  date_envoi TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.intervenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_intervenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emargements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

-- Public read access for sessions and intervenants (portail public)
CREATE POLICY "Sessions are publicly readable" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Intervenants are publicly readable" ON public.intervenants FOR SELECT USING (true);
CREATE POLICY "Session intervenants are publicly readable" ON public.session_intervenants FOR SELECT USING (true);

-- Public insert for participants and inscriptions (formulaire d'inscription public)
CREATE POLICY "Anyone can register as participant" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create inscription" ON public.inscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants are publicly readable" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Inscriptions are publicly readable" ON public.inscriptions FOR SELECT USING (true);

-- Authenticated admin access for all operations
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage intervenants" ON public.intervenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage session_intervenants" ON public.session_intervenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage participants" ON public.participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage inscriptions" ON public.inscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage emargements" ON public.emargements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage attestations" ON public.attestations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read for emargements
CREATE POLICY "Emargements are publicly readable" ON public.emargements FOR SELECT USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_intervenants_updated_at BEFORE UPDATE ON public.intervenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_inscriptions_session ON public.inscriptions(session_id);
CREATE INDEX idx_inscriptions_participant ON public.inscriptions(participant_id);
CREATE INDEX idx_emargements_inscription ON public.emargements(inscription_id);
CREATE INDEX idx_notifications_session ON public.notifications(session_id);
CREATE INDEX idx_attestations_inscription ON public.attestations(inscription_id);
CREATE INDEX idx_sessions_date ON public.sessions(date_session);
CREATE INDEX idx_sessions_statut ON public.sessions(statut);
