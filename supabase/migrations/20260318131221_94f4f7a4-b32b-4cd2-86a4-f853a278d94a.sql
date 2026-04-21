
-- Allow active admins to delete inscriptions (not just superadmins)
CREATE POLICY "inscriptions_admin_delete"
ON public.inscriptions
FOR DELETE
TO authenticated
USING (public.is_active_admin(auth.email()));
