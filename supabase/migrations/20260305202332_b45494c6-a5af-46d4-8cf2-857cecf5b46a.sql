
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "settings_admin_all" ON public.settings
  FOR ALL TO authenticated
  USING (is_active_admin(auth.email()))
  WITH CHECK (is_active_admin(auth.email()));

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
  ('org_nom', 'VDE - Vitrine de l''Export'),
  ('org_email', 'contact@vde-export.com'),
  ('org_telephone', '+33 1 23 45 67 89'),
  ('org_adresse', '12 Rue de l''Export, 75008 Paris'),
  ('notif_confirmation', 'true'),
  ('notif_rappel_j2', 'true'),
  ('notif_rappel_j1', 'true'),
  ('notif_post_session', 'true'),
  ('notif_attestations', 'true'),
  ('email_expediteur', 'noreply@vde-export.com'),
  ('email_nom_affichage', 'VDE - Vitrine de l''Export'),
  ('securite_2fa', 'false'),
  ('securite_journalisation', 'true');
