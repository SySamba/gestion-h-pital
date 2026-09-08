-- MedikaSN v4 — Nouvelles fonctionnalités (simulation paiements, triage, téléconsultation, multi-sites)
USE gestion_hopital;

-- Établissements (multi-sites)
CREATE TABLE IF NOT EXISTS etablissements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  ville VARCHAR(100) DEFAULT 'Dakar',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO etablissements (id, nom, adresse, telephone, ville) VALUES
(1, 'MedikaSN Clinique Plateau', '15 Avenue Léopold Sédar Senghor, Plateau', '+221338212345', 'Dakar'),
(2, 'MedikaSN Almadies', 'Route des Almadies, Immeuble Santé+', '+221338765432', 'Dakar');

-- Paiements simulés (Wave / Orange Money / Free Money)
CREATE TABLE IF NOT EXISTS paiements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reference_type ENUM('ticket','rendez_vous') NOT NULL,
  reference_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  operateur ENUM('wave','orange_money','free_money') NOT NULL,
  telephone VARCHAR(20),
  statut ENUM('en_attente','succes','echec','annule') DEFAULT 'en_attente',
  reference_transaction VARCHAR(100),
  mode_simulation BOOLEAN DEFAULT TRUE,
  recu_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SMS simulés (rappels RDV, file d'attente)
CREATE TABLE IF NOT EXISTS sms_simulations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  telephone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('rdv_rappel','file_attente','resultat','paiement','custom') DEFAULT 'custom',
  statut ENUM('envoye','echec') DEFAULT 'envoye',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Téléconsultations
CREATE TABLE IF NOT EXISTS teleconsultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  rendez_vous_id INT,
  date_heure DATETIME NOT NULL,
  statut ENUM('planifiee','en_cours','terminee','annulee') DEFAULT 'planifiee',
  lien_simulation VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE,
  FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id) ON DELETE SET NULL
);

-- Colonnes tickets : triage + paiement
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'priorite');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN priorite ENUM(''normale'',''urgente'',''tres_urgente'') DEFAULT ''normale''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'paye');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN paye BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'paiement_id');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN paiement_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Colonnes rendez-vous : paiement + SMS
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rendez_vous' AND COLUMN_NAME = 'paye');
SET @sql = IF(@col = 0, 'ALTER TABLE rendez_vous ADD COLUMN paye BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rendez_vous' AND COLUMN_NAME = 'paiement_id');
SET @sql = IF(@col = 0, 'ALTER TABLE rendez_vous ADD COLUMN paiement_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rendez_vous' AND COLUMN_NAME = 'sms_rappel_envoye');
SET @sql = IF(@col = 0, 'ALTER TABLE rendez_vous ADD COLUMN sms_rappel_envoye BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Colonne patients : établissement
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'etablissement_id');
SET @sql = IF(@col = 0, 'ALTER TABLE patients ADD COLUMN etablissement_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE patients SET etablissement_id = 1 WHERE etablissement_id IS NULL;
