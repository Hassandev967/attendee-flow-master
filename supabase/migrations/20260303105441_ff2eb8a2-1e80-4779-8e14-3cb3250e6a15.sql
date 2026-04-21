-- Drop restrictive admin policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;
CREATE POLICY "Anyone can manage sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage participants" ON public.participants;
CREATE POLICY "Anyone can manage participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage inscriptions" ON public.inscriptions;
CREATE POLICY "Anyone can manage inscriptions" ON public.inscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage emargements" ON public.emargements;
CREATE POLICY "Anyone can manage emargements" ON public.emargements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Anyone can manage notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage attestations" ON public.attestations;
CREATE POLICY "Anyone can manage attestations" ON public.attestations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage intervenants" ON public.intervenants;
CREATE POLICY "Anyone can manage intervenants" ON public.intervenants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage session_intervenants" ON public.session_intervenants;
CREATE POLICY "Anyone can manage session_intervenants" ON public.session_intervenants FOR ALL USING (true) WITH CHECK (true);