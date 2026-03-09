
-- Create audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details text,
  user_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read audit logs
CREATE POLICY "audit_log_superadmin_read"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.email()));

-- Authenticated admins can insert logs
CREATE POLICY "audit_log_admin_insert"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_active_admin(auth.email()));
