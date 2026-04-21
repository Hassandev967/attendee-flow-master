
-- Fix RESTRICTIVE policies to PERMISSIVE for public insert on participants, inscriptions, participant_secteurs

-- participants
DROP POLICY IF EXISTS "participants_public_insert" ON public.participants;
CREATE POLICY "participants_public_insert" ON public.participants FOR INSERT TO anon, authenticated WITH CHECK (true);

-- inscriptions
DROP POLICY IF EXISTS "inscriptions_public_insert" ON public.inscriptions;
CREATE POLICY "inscriptions_public_insert" ON public.inscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- participant_secteurs
DROP POLICY IF EXISTS "participant_secteurs_public_insert" ON public.participant_secteurs;
CREATE POLICY "participant_secteurs_public_insert" ON public.participant_secteurs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Also need permissive SELECT policies for formations and secteurs/sources (currently restrictive)
DROP POLICY IF EXISTS "formations_public_read" ON public.formations;
CREATE POLICY "formations_public_read" ON public.formations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "secteurs_public_read" ON public.secteurs;
CREATE POLICY "secteurs_public_read" ON public.secteurs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sources_public_read" ON public.sources_information;
CREATE POLICY "sources_public_read" ON public.sources_information FOR SELECT TO anon, authenticated USING (true);
