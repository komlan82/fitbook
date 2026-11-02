USE fitbook;
DELIMITER //
DROP PROCEDURE IF EXISTS sp_reserver_seance//
CREATE PROCEDURE sp_reserver_seance(IN p_user INT, IN p_seance INT, OUT p_code VARCHAR(30))
BEGIN
  DECLARE v_max INT; DECLARE v_prises INT; DECLARE v_statut VARCHAR(20); DECLARE v_debut DATETIME;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; SET p_code='ERREUR_SQL'; END;
  START TRANSACTION;
  SELECT places_max, statut, date_debut INTO v_max, v_statut, v_debut FROM seance WHERE id_seance=p_seance FOR UPDATE;
  IF v_max IS NULL THEN SET p_code='SEANCE_INTROUVABLE';
  ELSEIF v_statut<>'ouverte' OR v_debut<=NOW() THEN SET p_code='SEANCE_FERMEE';
  ELSEIF EXISTS (SELECT 1 FROM reserver WHERE id_utilisateur=p_user AND id_seance=p_seance AND statut<>'annulee') THEN SET p_code='DEJA_RESERVEE';
  ELSE
    SELECT COUNT(*) INTO v_prises FROM reserver WHERE id_seance=p_seance AND statut<>'annulee';
    IF v_prises>=v_max THEN SET p_code='COMPLETE';
    ELSE
      INSERT INTO reserver (id_utilisateur,id_seance,statut) VALUES (p_user,p_seance,'confirmee')
        ON DUPLICATE KEY UPDATE statut='confirmee', date_reservation=NOW();
      SET p_code='OK';
    END IF;
  END IF;
  COMMIT;
END//

DROP PROCEDURE IF EXISTS sp_annuler_reservation//
CREATE PROCEDURE sp_annuler_reservation(IN p_user INT, IN p_seance INT, OUT p_code VARCHAR(30))
BEGIN
  DECLARE v_debut DATETIME;
  SELECT date_debut INTO v_debut FROM seance WHERE id_seance=p_seance;
  IF v_debut IS NULL THEN SET p_code='SEANCE_INTROUVABLE';
  ELSEIF v_debut<=NOW() THEN SET p_code='TROP_TARD';
  ELSE
    UPDATE reserver SET statut='annulee' WHERE id_utilisateur=p_user AND id_seance=p_seance AND statut<>'annulee';
    SET p_code=IF(ROW_COUNT()=1,'OK','RESERVATION_INTROUVABLE');
  END IF;
END//

DROP PROCEDURE IF EXISTS sp_ajouter_avis//
CREATE PROCEDURE sp_ajouter_avis(IN p_user INT, IN p_salle INT, IN p_coach INT, IN p_note INT, IN p_comm TEXT, OUT p_code VARCHAR(30))
BEGIN
  IF (p_salle IS NULL) = (p_coach IS NULL) THEN SET p_code='UNE_SEULE_CIBLE';
  ELSEIF p_note<1 OR p_note>5 THEN SET p_code='NOTE_INVALIDE';
  ELSEIF NOT EXISTS (
     SELECT 1 FROM reserver r JOIN seance s ON s.id_seance=r.id_seance
     WHERE r.id_utilisateur=p_user AND r.statut='confirmee' AND s.date_fin<NOW()
       AND ((p_salle IS NOT NULL AND s.id_salle=p_salle) OR (p_coach IS NOT NULL AND s.id_coach=p_coach))
  ) THEN SET p_code='SEANCE_NON_SUIVIE';
  ELSE
    INSERT INTO avis (id_utilisateur,id_salle,id_coach,note,commentaire) VALUES (p_user,p_salle,p_coach,p_note,p_comm);
    SET p_code='OK';
  END IF;
END//
DELIMITER ;
