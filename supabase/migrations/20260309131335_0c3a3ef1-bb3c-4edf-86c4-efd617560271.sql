
-- Allow superadmins to manage admins table
CREATE POLICY "admins_superadmin_insert"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin(auth.email()));

CREATE POLICY "admins_superadmin_update"
ON public.admins
FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.email()))
WITH CHECK (public.is_superadmin(auth.email()));

CREATE POLICY "admins_superadmin_delete"
ON public.admins
FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.email()));
