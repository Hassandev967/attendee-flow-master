
-- Create security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_active_admin(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = check_email AND actif = true
  )
$$;

-- Drop existing recursive policies
DROP POLICY IF EXISTS "admins_admin_read" ON public.admins;
DROP POLICY IF EXISTS "formations_admin_write" ON public.formations;
DROP POLICY IF EXISTS "inscriptions_admin_read" ON public.inscriptions;
DROP POLICY IF EXISTS "presences_admin_all" ON public.presences;
DROP POLICY IF EXISTS "participants_admin_read" ON public.participants;
DROP POLICY IF EXISTS "participant_secteurs_admin_read" ON public.participant_secteurs;

-- Recreate policies using the security definer function
CREATE POLICY "admins_admin_read" ON public.admins
  FOR SELECT USING (public.is_active_admin(auth.email()));

CREATE POLICY "formations_admin_write" ON public.formations
  FOR ALL USING (public.is_active_admin(auth.email()))
  WITH CHECK (public.is_active_admin(auth.email()));

CREATE POLICY "inscriptions_admin_read" ON public.inscriptions
  FOR SELECT USING (public.is_active_admin(auth.email()));

CREATE POLICY "presences_admin_all" ON public.presences
  FOR ALL USING (public.is_active_admin(auth.email()))
  WITH CHECK (public.is_active_admin(auth.email()));

CREATE POLICY "participants_admin_read" ON public.participants
  FOR SELECT USING (public.is_active_admin(auth.email()));

CREATE POLICY "participant_secteurs_admin_read" ON public.participant_secteurs
  FOR SELECT USING (public.is_active_admin(auth.email()));
