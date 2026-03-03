-- Replace permissive "Anyone can manage" policies with authenticated-only write policies
-- Keep public read access for the inscription flow

-- SESSIONS: authenticated can manage, public can read
DROP POLICY IF EXISTS "Anyone can manage sessions" ON public.sessions;
CREATE POLICY "Authenticated users can manage sessions" ON public.sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PARTICIPANTS: authenticated can manage, public can insert (inscription) and read
DROP POLICY IF EXISTS "Anyone can manage participants" ON public.participants;
CREATE POLICY "Authenticated users can manage participants" ON public.participants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- INSCRIPTIONS: authenticated can manage, public can insert and read
DROP POLICY IF EXISTS "Anyone can manage inscriptions" ON public.inscriptions;
CREATE POLICY "Authenticated users can manage inscriptions" ON public.inscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EMARGEMENTS: authenticated only
DROP POLICY IF EXISTS "Anyone can manage emargements" ON public.emargements;
CREATE POLICY "Authenticated users can manage emargements" ON public.emargements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- NOTIFICATIONS: authenticated only
DROP POLICY IF EXISTS "Anyone can manage notifications" ON public.notifications;
CREATE POLICY "Authenticated users can manage notifications" ON public.notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ATTESTATIONS: authenticated only
DROP POLICY IF EXISTS "Anyone can manage attestations" ON public.attestations;
CREATE POLICY "Authenticated users can manage attestations" ON public.attestations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- INTERVENANTS: authenticated can manage, public can read
DROP POLICY IF EXISTS "Anyone can manage intervenants" ON public.intervenants;
CREATE POLICY "Authenticated users can manage intervenants" ON public.intervenants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SESSION_INTERVENANTS: authenticated can manage, public can read
DROP POLICY IF EXISTS "Anyone can manage session_intervenants" ON public.session_intervenants;
CREATE POLICY "Authenticated users can manage session_intervenants" ON public.session_intervenants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);