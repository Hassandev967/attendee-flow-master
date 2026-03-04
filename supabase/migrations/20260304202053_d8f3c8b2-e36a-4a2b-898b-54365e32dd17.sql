
-- Fix security definer views by recreating with security_invoker
DROP VIEW IF EXISTS public.v_inscriptions CASCADE;
DROP VIEW IF EXISTS public.v_taux_remplissage CASCADE;
DROP VIEW IF EXISTS public.v_stats_dashboard CASCADE;

CREATE VIEW public.v_inscriptions WITH (security_invoker = true) AS
SELECT
    i.id AS inscription_id, i.date_inscription, i.statut AS statut_inscription,
    f.id AS formation_id, f.titre AS formation_titre, f.theme, f.date_debut, f.lieu, f.statut AS statut_formation,
    p.id AS participant_id, p.nom_dirigeant, p.nom_entreprise, p.email, p.telephone,
    si.nom AS source, pr.present
FROM public.inscriptions i
JOIN public.formations f ON f.id = i.formation_id
JOIN public.participants p ON p.id = i.participant_id
LEFT JOIN public.sources_information si ON si.id = p.source_id
LEFT JOIN public.presences pr ON pr.inscription_id = i.id;

CREATE VIEW public.v_taux_remplissage WITH (security_invoker = true) AS
SELECT
    f.id, f.titre, f.theme, f.date_debut, f.statut, f.places,
    COUNT(i.id) AS inscrits,
    ROUND(COUNT(i.id)::NUMERIC / NULLIF(f.places, 0) * 100, 1) AS taux_pct
FROM public.formations f
LEFT JOIN public.inscriptions i ON i.formation_id = f.id AND i.statut != 'Annulée'
GROUP BY f.id;

CREATE VIEW public.v_stats_dashboard WITH (security_invoker = true) AS
SELECT
    (SELECT COUNT(*) FROM public.formations) AS total_formations,
    (SELECT COUNT(*) FROM public.formations WHERE statut = 'A venir') AS formations_a_venir,
    (SELECT COUNT(*) FROM public.formations WHERE statut = 'Terminée') AS formations_terminees,
    (SELECT COUNT(*) FROM public.inscriptions WHERE statut = 'Confirmée') AS total_inscrits,
    (SELECT COUNT(*) FROM public.presences WHERE present = TRUE) AS total_presents,
    (SELECT COUNT(*) FROM public.participants) AS total_participants;
