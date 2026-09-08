-- MedikaSN v5 — Écran salle d'attente, appel patient, alertes urgence
USE gestion_hopital;

-- Colonnes tickets : salle, médecin, statut d'appel, affichage nom
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'salle');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN salle VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'medecin_appel');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN medecin_appel VARCHAR(150) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'statut_appel');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN statut_appel ENUM(''en_attente'',''appele'',''en_consultation'') DEFAULT ''en_attente''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'afficher_nom_patient');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN afficher_nom_patient BOOLEAN DEFAULT TRUE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'appele_at');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN appele_at TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Alertes urgence / secours (bouton SOS patient)
CREATE TABLE IF NOT EXISTS alertes_urgence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  patient_id INT NULL,
  ticket_id INT NULL,
  message TEXT,
  localisation VARCHAR(200) DEFAULT 'Salle d''attente',
  statut ENUM('active','prise_en_charge','resolue') DEFAULT 'active',
  traite_par INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  traite_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  FOREIGN KEY (traite_par) REFERENCES users(id) ON DELETE SET NULL
);
