
-- Table: dynamic_forms (les formulaires créés par les admins)
CREATE TABLE public.dynamic_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  slug text UNIQUE NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: dynamic_form_fields (les champs de chaque formulaire)
CREATE TABLE public.dynamic_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.dynamic_forms(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  placeholder text,
  options jsonb DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  width text NOT NULL DEFAULT 'full',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: dynamic_form_submissions (les soumissions)
CREATE TABLE public.dynamic_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.dynamic_forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: dropdown_menus (menus déroulants réutilisables)
CREATE TABLE public.dropdown_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_menus ENABLE ROW LEVEL SECURITY;

-- dynamic_forms: admin full access, public read active forms
CREATE POLICY "dynamic_forms_admin_all" ON public.dynamic_forms FOR ALL TO authenticated
  USING (is_active_admin(auth.email())) WITH CHECK (is_active_admin(auth.email()));
CREATE POLICY "dynamic_forms_public_read" ON public.dynamic_forms FOR SELECT TO anon, authenticated
  USING (is_public = true AND is_active = true);

-- dynamic_form_fields: admin full, public read fields of visible forms
CREATE POLICY "dynamic_form_fields_admin_all" ON public.dynamic_form_fields FOR ALL TO authenticated
  USING (is_active_admin(auth.email())) WITH CHECK (is_active_admin(auth.email()));
CREATE POLICY "dynamic_form_fields_public_read" ON public.dynamic_form_fields FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.dynamic_forms WHERE id = form_id AND is_public = true AND is_active = true));

-- dynamic_form_submissions: admin read all, public insert
CREATE POLICY "dynamic_form_submissions_admin_read" ON public.dynamic_form_submissions FOR SELECT TO authenticated
  USING (is_active_admin(auth.email()));
CREATE POLICY "dynamic_form_submissions_public_insert" ON public.dynamic_form_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "dynamic_form_submissions_admin_delete" ON public.dynamic_form_submissions FOR DELETE TO authenticated
  USING (is_active_admin(auth.email()));

-- dropdown_menus: admin full, public read
CREATE POLICY "dropdown_menus_admin_all" ON public.dropdown_menus FOR ALL TO authenticated
  USING (is_active_admin(auth.email())) WITH CHECK (is_active_admin(auth.email()));
CREATE POLICY "dropdown_menus_public_read" ON public.dropdown_menus FOR SELECT TO anon, authenticated
  USING (true);

-- Trigger updated_at
CREATE TRIGGER update_dynamic_forms_updated_at BEFORE UPDATE ON public.dynamic_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dropdown_menus_updated_at BEFORE UPDATE ON public.dropdown_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
