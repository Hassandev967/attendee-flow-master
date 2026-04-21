
-- Drop existing views if any
DROP VIEW IF EXISTS v_inscriptions CASCADE;
DROP VIEW IF EXISTS v_taux_remplissage CASCADE;
DROP VIEW IF EXISTS v_stats_dashboard CASCADE;

-- Drop existing tables in correct order (respect FK)
DROP TABLE IF EXISTS attestations CASCADE;
DROP TABLE IF EXISTS emargements CASCADE;
DROP TABLE IF EXISTS inscriptions CASCADE;
DROP TABLE IF EXISTS session_intervenants CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS intervenants CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS emargement_mode CASCADE;
DROP TYPE IF EXISTS niveau_export CASCADE;
DROP TYPE IF EXISTS notification_statut CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS session_mode CASCADE;
DROP TYPE IF EXISTS session_statut CASCADE;

-- ============================================================
-- 1. TABLE : formations
-- ============================================================
CREATE TABLE public.formations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre       VARCHAR(255)    NOT NULL,
    theme       VARCHAR(100)    NOT NULL,
    date_debut  DATE            NOT NULL,
    duree       VARCHAR(50),
    lieu        VARCHAR(255),
    formateur   VARCHAR(255),
    places      INTEGER         NOT NULL DEFAULT 30,
    statut      VARCHAR(20)     NOT NULL DEFAULT 'A venir',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. TABLE : secteurs
-- ============================================================
CREATE TABLE public.secteurs (
    id    SMALLSERIAL  PRIMARY KEY,
    nom   VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO public.secteurs (nom) VALUES
    ('Agroalimentaires'),
    ('Cosmétiques'),
    ('Cotons, Textiles et habillements'),
    ('Énergies'),
    ('Industries Pharmaceutiques'),
    ('Transports et logistiques'),
    ('Tourismes, Artisanats et Cultures'),
    ('BTP'),
    ('Biens et Services');

-- ============================================================
-- 3. TABLE : sources_information
-- ============================================================
CREATE TABLE public.sources_information (
    id    SMALLSERIAL  PRIMARY KEY,
    nom   VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO public.sources_information (nom) VALUES
    ('Site Internet'),
    ('Facebook'),
    ('Instagram'),
    ('LinkedIn'),
    ('Bouche à oreilles');

-- ============================================================
-- 4. TABLE : participants
-- ============================================================
CREATE TABLE public.participants (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_entreprise       VARCHAR(255)  NOT NULL,
    nom_dirigeant        VARCHAR(255)  NOT NULL,
    telephone            VARCHAR(30),
    email                VARCHAR(255)  NOT NULL,
    source_id            SMALLINT      REFERENCES public.sources_information(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_participant_email UNIQUE (email)
);

-- ============================================================
-- 5. TABLE : participant_secteurs
-- ============================================================
CREATE TABLE public.participant_secteurs (
    participant_id  UUID      NOT NULL REFERENCES public.participants(id)  ON DELETE CASCADE,
    secteur_id      SMALLINT  NOT NULL REFERENCES public.secteurs(id)      ON DELETE RESTRICT,
    PRIMARY KEY (participant_id, secteur_id)
);

-- ============================================================
-- 6. TABLE : inscriptions
-- ============================================================
CREATE TABLE public.inscriptions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id     UUID         NOT NULL REFERENCES public.formations(id)   ON DELETE CASCADE,
    participant_id   UUID         NOT NULL REFERENCES public.participants(id)  ON DELETE CASCADE,
    date_inscription DATE         NOT NULL DEFAULT CURRENT_DATE,
    statut           VARCHAR(20)  NOT NULL DEFAULT 'Confirmée',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inscription UNIQUE (formation_id, participant_id)
);

-- ============================================================
-- 7. TABLE : presences
-- ============================================================
CREATE TABLE public.presences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscription_id  UUID        NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
    present         BOOLEAN     NOT NULL DEFAULT FALSE,
    note            TEXT,
    enregistre_par  VARCHAR(255),
    enregistre_le   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_presence UNIQUE (inscription_id)
);

-- ============================================================
-- 8. TABLE : admins
-- ============================================================
CREATE TABLE public.admins (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    nom_complet  VARCHAR(255),
    role         VARCHAR(50)  NOT NULL DEFAULT 'admin',
    actif        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO public.admins (email, nom_complet, role) VALUES
    ('admin@aciex.ci',     'Administrateur Principal',  'superadmin'),
    ('dsi@aciex.ci',       'Direction des Systèmes d''Information', 'admin'),
    ('formation@aciex.ci', 'Responsable Formations',    'admin');

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_formations_updated_at
    BEFORE UPDATE ON public.formations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================
CREATE VIEW public.v_inscriptions AS
SELECT
    i.id                            AS inscription_id,
    i.date_inscription,
    i.statut                        AS statut_inscription,
    f.id                            AS formation_id,
    f.titre                         AS formation_titre,
    f.theme,
    f.date_debut,
    f.lieu,
    f.statut                        AS statut_formation,
    p.id                            AS participant_id,
    p.nom_dirigeant,
    p.nom_entreprise,
    p.email,
    p.telephone,
    si.nom                          AS source,
    pr.present
FROM public.inscriptions i
JOIN public.formations   f  ON f.id = i.formation_id
JOIN public.participants p  ON p.id = i.participant_id
LEFT JOIN public.sources_information si ON si.id = p.source_id
LEFT JOIN public.presences pr ON pr.inscription_id = i.id;

CREATE VIEW public.v_taux_remplissage AS
SELECT
    f.id,
    f.titre,
    f.theme,
    f.date_debut,
    f.statut,
    f.places,
    COUNT(i.id)                                         AS inscrits,
    ROUND(COUNT(i.id)::NUMERIC / NULLIF(f.places, 0) * 100, 1)    AS taux_pct
FROM public.formations f
LEFT JOIN public.inscriptions i ON i.formation_id = f.id AND i.statut != 'Annulée'
GROUP BY f.id;

CREATE VIEW public.v_stats_dashboard AS
SELECT
    (SELECT COUNT(*) FROM public.formations)                                    AS total_formations,
    (SELECT COUNT(*) FROM public.formations WHERE statut = 'A venir')          AS formations_a_venir,
    (SELECT COUNT(*) FROM public.formations WHERE statut = 'Terminée')         AS formations_terminees,
    (SELECT COUNT(*) FROM public.inscriptions WHERE statut = 'Confirmée')      AS total_inscrits,
    (SELECT COUNT(*) FROM public.presences  WHERE present = TRUE)              AS total_presents,
    (SELECT COUNT(*) FROM public.participants)                                  AS total_participants;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_inscriptions_formation  ON public.inscriptions(formation_id);
CREATE INDEX idx_inscriptions_participant ON public.inscriptions(participant_id);
CREATE INDEX idx_presences_inscription   ON public.presences(inscription_id);
CREATE INDEX idx_participants_email      ON public.participants(email);
CREATE INDEX idx_formations_statut       ON public.formations(statut);
CREATE INDEX idx_formations_date         ON public.formations(date_debut);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.formations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_secteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins              ENABLE ROW LEVEL SECURITY;

-- Formations: public read
CREATE POLICY "formations_public_read"
    ON public.formations FOR SELECT
    USING (true);

-- Formations: admin write
CREATE POLICY "formations_admin_write"
    ON public.formations FOR ALL
    TO authenticated
    USING (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE))
    WITH CHECK (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE));

-- Inscriptions: public insert
CREATE POLICY "inscriptions_public_insert"
    ON public.inscriptions FOR INSERT
    WITH CHECK (true);

-- Inscriptions: admin read
CREATE POLICY "inscriptions_admin_read"
    ON public.inscriptions FOR SELECT
    TO authenticated
    USING (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE));

-- Presences: admin only
CREATE POLICY "presences_admin_all"
    ON public.presences FOR ALL
    TO authenticated
    USING (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE))
    WITH CHECK (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE));

-- Participants: public insert
CREATE POLICY "participants_public_insert"
    ON public.participants FOR INSERT
    WITH CHECK (true);

-- Participants: admin read
CREATE POLICY "participants_admin_read"
    ON public.participants FOR SELECT
    TO authenticated
    USING (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE));

-- Participant_secteurs: public insert
CREATE POLICY "participant_secteurs_public_insert"
    ON public.participant_secteurs FOR INSERT
    WITH CHECK (true);

-- Participant_secteurs: admin read
CREATE POLICY "participant_secteurs_admin_read"
    ON public.participant_secteurs FOR SELECT
    TO authenticated
    USING (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE));

-- Admins: admin read only
CREATE POLICY "admins_admin_read"
    ON public.admins FOR SELECT
    TO authenticated
    USING (auth.email() IN (SELECT email FROM public.admins WHERE actif = TRUE));

-- Secteurs: public read
ALTER TABLE public.secteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "secteurs_public_read"
    ON public.secteurs FOR SELECT
    USING (true);

-- Sources: public read
ALTER TABLE public.sources_information ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_public_read"
    ON public.sources_information FOR SELECT
    USING (true);
