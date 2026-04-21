
CREATE OR REPLACE FUNCTION public.inscrire_participant(
  p_formation_id uuid,
  p_nom_entreprise text,
  p_nom_dirigeant text,
  p_email text,
  p_telephone text,
  p_source_id int DEFAULT NULL,
  p_secteur_ids int[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_id uuid;
BEGIN
  -- Upsert participant
  INSERT INTO participants (nom_entreprise, nom_dirigeant, email, telephone, source_id)
  VALUES (p_nom_entreprise, p_nom_dirigeant, p_email, p_telephone, p_source_id)
  ON CONFLICT (email) DO UPDATE SET
    nom_entreprise = EXCLUDED.nom_entreprise,
    nom_dirigeant = EXCLUDED.nom_dirigeant,
    telephone = EXCLUDED.telephone,
    source_id = EXCLUDED.source_id,
    updated_at = now()
  RETURNING id INTO v_participant_id;

  -- Replace secteurs
  DELETE FROM participant_secteurs WHERE participant_id = v_participant_id;
  IF array_length(p_secteur_ids, 1) > 0 THEN
    INSERT INTO participant_secteurs (participant_id, secteur_id)
    SELECT v_participant_id, unnest(p_secteur_ids);
  END IF;

  -- Create inscription
  INSERT INTO inscriptions (formation_id, participant_id)
  VALUES (p_formation_id, v_participant_id);
END;
$$;
