-- Migration v8 — Certificats médicaux, Hospitalisation & Lits, Assurances
USE gestion_hopital;

-- ═══════════════════════════════════════════════════════════════
-- 1. CERTIFICATS MÉDICAUX
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS certificats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  type ENUM('arret_travail','aptitude','consultation','hospitalisation','deces','autre') NOT NULL,
  numero VARCHAR(30) NOT NULL UNIQUE,
  date_examen DATE NOT NULL,
  date_debut DATE NULL COMMENT 'Début arrêt ou période',
  date_fin DATE NULL COMMENT 'Fin arrêt ou période',
  nombre_jours INT NULL COMMENT 'Pour arrêt de travail',
  contenu TEXT NOT NULL COMMENT 'Corps du certificat',
  conclusion TEXT NULL,
  lieu VARCHAR(100) NULL,
  date_emission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════
-- 2. LITS & HOSPITALISATION
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salle_id INT NOT NULL,
  numero VARCHAR(20) NOT NULL,
  statut ENUM('libre','occupe','maintenance','reserve') DEFAULT 'libre',
  type ENUM('standard','reanimation','soins_intensifs','maternite') DEFAULT 'standard',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_lit_salle (salle_id, numero)
);

CREATE TABLE IF NOT EXISTS hospitalisations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  lit_id INT NOT NULL,
  medecin_id INT NULL,
  motif_admission VARCHAR(255) NOT NULL,
  diagnostic_admission TEXT NULL,
  notes_admission TEXT NULL,
  statut ENUM('en_cours','sortie','transfert','deces') DEFAULT 'en_cours',
  date_admission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_sortie TIMESTAMP NULL,
  motif_sortie VARCHAR(255) NULL,
  notes_sortie TEXT NULL,
  cout_journalier DECIMAL(12,2) DEFAULT 10000.00,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (lit_id) REFERENCES lits(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════════════
-- 3. ASSURANCES / TIERS PAYANT
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  type ENUM('assurance_sante','mutuelle','ipm','cnss','autre') DEFAULT 'assurance_sante',
  telephone VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  adresse TEXT NULL,
  taux_couverture DECIMAL(5,2) DEFAULT 80.00 COMMENT 'Pourcentage couvert',
  plafond_annuel DECIMAL(12,2) NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_assurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  assurance_id INT NOT NULL,
  numero_adherent VARCHAR(100) NOT NULL,
  taux_couverture DECIMAL(5,2) NULL COMMENT 'Surcharge du taux par patient',
  date_debut DATE NULL,
  date_fin DATE NULL,
  statut ENUM('actif','expire','suspendu') DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assurance_id) REFERENCES assurances(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════
-- DONNÉES DE DÉMO
-- ═══════════════════════════════════════════════════════════════
INSERT IGNORE INTO assurances (id, nom, type, telephone, taux_couverture) VALUES
(1, 'IPM Sénégal', 'ipm', '+221 33 823 45 67', 80.00),
(2, 'CNSS Sénégal', 'cnss', '+221 33 839 50 50', 70.00),
(3, 'Allianz Sénégal', 'assurance_sante', '+221 33 869 70 00', 90.00),
(4, 'NSIA Assurance', 'assurance_sante', '+221 33 824 30 00', 85.00),
(5, 'SUNU Assurances', 'mutuelle', '+221 33 869 11 11', 75.00);
