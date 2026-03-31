-- Add type column to formations to distinguish formations from événements
ALTER TABLE formations ADD COLUMN type text NOT NULL DEFAULT 'formation'
  CHECK (type IN ('formation', 'evenement'));

-- Create event_participants table for event registrations
-- Events use category-specific fields (entreprise/talent/jeune) unlike formation participants
CREATE TABLE event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  categorie text NOT NULL CHECK (categorie IN ('entreprise', 'talent', 'jeune')),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  telephone text,
  -- entreprise & talent category
  entreprise text,
  -- entreprise only
  fonction text,
  -- talent only
  pays_origine text,
  -- jeune only
  niveau_etude text,
  statut text NOT NULL DEFAULT 'confirmé',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(formation_id, email)
);

-- Enable RLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Public insert for registration forms
CREATE POLICY "event_participants_public_insert"
ON event_participants FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admin read access
CREATE POLICY "event_participants_admin_select"
ON event_participants FOR SELECT TO authenticated
USING (public.is_active_admin(auth.email()));

-- Admin delete access
CREATE POLICY "event_participants_admin_delete"
ON event_participants FOR DELETE TO authenticated
USING (public.is_active_admin(auth.email()));
