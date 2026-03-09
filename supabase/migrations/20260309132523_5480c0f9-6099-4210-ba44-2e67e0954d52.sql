
-- Table des champs personnalisés globaux
CREATE TABLE public.custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text', -- text, select, checkbox, number
  options jsonb DEFAULT '[]'::jsonb, -- pour les listes déroulantes
  required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des valeurs saisies par les participants
CREATE TABLE public.custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id uuid NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  formation_id uuid NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  participant_email text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on custom_fields
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Everyone can read active custom fields (needed for public form)
CREATE POLICY "custom_fields_public_read" ON public.custom_fields
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "custom_fields_admin_write" ON public.custom_fields
  FOR ALL TO authenticated
  USING (is_active_admin(auth.email()))
  WITH CHECK (is_active_admin(auth.email()));

-- RLS on custom_field_values
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Public can insert (during registration)
CREATE POLICY "custom_field_values_public_insert" ON public.custom_field_values
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins can read
CREATE POLICY "custom_field_values_admin_read" ON public.custom_field_values
  FOR SELECT TO authenticated
  USING (is_active_admin(auth.email()));
