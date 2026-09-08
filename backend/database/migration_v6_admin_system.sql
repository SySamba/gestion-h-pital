USE gestion_hopital;

-- Paramètres système (admin)
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  nom_hopital VARCHAR(200) NOT NULL DEFAULT 'MedikaSN',
  slogan VARCHAR(255) DEFAULT 'N°1 de la santé digitale au Sénégal',
  adresse TEXT,
  telephone VARCHAR(30),
  email VARCHAR(255),
  ticket_duree_minutes INT NOT NULL DEFAULT 120 COMMENT 'Validité ticket en minutes',
  ticket_prix DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  temps_attente_moyen_min INT NOT NULL DEFAULT 8,
  annonce_repetitions INT NOT NULL DEFAULT 3,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_settings (id, nom_hopital, slogan, adresse, telephone, email)
VALUES (1, 'MedikaSN', 'N°1 de la santé digitale au Sénégal',
  'Avenue Cheikh Anta Diop, Plateau — Dakar, Sénégal', '+221 33 800 00 00', 'contact@medikasn.sn');

-- Salles / cabinets
CREATE TABLE IF NOT EXISTS salles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  type ENUM('consultation','urgence','laboratoire','autre') DEFAULT 'consultation',
  medecin_id INT NULL,
  actif BOOLEAN DEFAULT TRUE,
  etablissement_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE SET NULL,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE SET NULL
);

INSERT IGNORE INTO salles (id, nom, type) VALUES
(1, 'Salle 1', 'consultation'),
(2, 'Salle 2', 'consultation'),
(3, 'Salle 3', 'consultation'),
(4, 'Cabinet A', 'consultation'),
(5, 'Cabinet B', 'consultation'),
(6, 'Box Urgences', 'urgence');

-- Guichets réception
CREATE TABLE IF NOT EXISTS guichets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  etablissement_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE SET NULL
);

INSERT IGNORE INTO guichets (id, nom) VALUES
(1, 'Guichet 1 — Accueil'),
(2, 'Guichet 2 — Accueil'),
(3, 'Guichet Urgences');

-- Tickets : expiration
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'expire_at');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN expire_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'duree_minutes');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN duree_minutes INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'salle_id');
SET @sql = IF(@col = 0, 'ALTER TABLE tickets ADD COLUMN salle_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
