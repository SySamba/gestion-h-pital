-- Migration v9 — Index de performance
-- Idempotente : chaque index n'est créé que s'il est absent.
USE gestion_hopital;

DROP PROCEDURE IF EXISTS add_index_if_missing;

CREATE PROCEDURE add_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_cols  VARCHAR(255)
)
BEGIN
  DECLARE v_table_exists INT DEFAULT 0;
  DECLARE v_index_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_table_exists
    FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = p_table;

  IF v_table_exists > 0 THEN
    SELECT COUNT(*) INTO v_index_exists
      FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index;

    IF v_index_exists = 0 THEN
      SET @ddl = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, ' (', p_cols, ')');
      PREPARE stmt FROM @ddl;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
  END IF;
END;

CALL add_index_if_missing('tickets', 'idx_tickets_patient', 'patient_id');
CALL add_index_if_missing('tickets', 'idx_tickets_statut_date', 'statut, created_at');
CALL add_index_if_missing('rendez_vous', 'idx_rdv_patient', 'patient_id');
CALL add_index_if_missing('rendez_vous', 'idx_rdv_medecin_date', 'medecin_id, date_heure');
CALL add_index_if_missing('analyses', 'idx_analyses_patient', 'patient_id');
CALL add_index_if_missing('analyses', 'idx_analyses_statut', 'statut');
CALL add_index_if_missing('ordonnances', 'idx_ordonnances_patient', 'patient_id');
CALL add_index_if_missing('historique_medical', 'idx_historique_patient', 'patient_id');
CALL add_index_if_missing('factures', 'idx_factures_patient', 'patient_id');
CALL add_index_if_missing('factures', 'idx_factures_statut_date', 'statut, date_creation');
CALL add_index_if_missing('transactions', 'idx_transactions_session', 'caisse_session_id');
CALL add_index_if_missing('transactions', 'idx_transactions_date', 'date_transaction');
CALL add_index_if_missing('notifications', 'idx_notifications_user_lu', 'user_id, lu');
CALL add_index_if_missing('certificats', 'idx_certificats_patient', 'patient_id');
CALL add_index_if_missing('lits', 'idx_lits_statut', 'statut');
CALL add_index_if_missing('hospitalisations', 'idx_hospitalisations_patient', 'patient_id');
CALL add_index_if_missing('hospitalisations', 'idx_hospitalisations_statut', 'statut');
CALL add_index_if_missing('patient_assurances', 'idx_patient_assurances_patient', 'patient_id');

DROP PROCEDURE IF EXISTS add_index_if_missing;
