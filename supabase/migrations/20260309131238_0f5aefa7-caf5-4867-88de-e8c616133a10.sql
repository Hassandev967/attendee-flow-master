
-- Function to check if user is a superadmin (t.coulibaly or h.cisse)
CREATE OR REPLACE FUNCTION public.is_superadmin(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = check_email 
      AND actif = true 
      AND role = 'superadmin'
  )
$$;

-- Add DELETE policy for formations (superadmins only)
CREATE POLICY "formations_superadmin_delete"
ON public.formations
FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.email()));

-- Add DELETE policy for related inscriptions (superadmins only, needed for cascade)
CREATE POLICY "inscriptions_superadmin_delete"
ON public.inscriptions
FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.email()));
