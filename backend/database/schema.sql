CREATE DATABASE IF NOT EXISTS gestion_hopital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_hopital;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','medecin','laborantin','pharmacien','receptionniste','caissier','admin') NOT NULL DEFAULT 'patient',
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  date_naissance DATE,
  sexe ENUM('M','F','Autre'),
  adresse TEXT,
  groupe_sanguin VARCHAR(5),
  allergies TEXT,
  qr_code VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medecins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  specialite VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disponibilites_medecins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medecin_id INT NOT NULL,
  jour_semaine TINYINT NOT NULL COMMENT '0=Dimanche, 6=Samedi',
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historique_medical (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT,
  diagnostic TEXT NOT NULL,
  notes TEXT,
  date_consultation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  numero VARCHAR(20) NOT NULL,
  statut ENUM('en_attente','en_cours','termine','annule') DEFAULT 'en_attente',
  prix DECIMAL(10,2) DEFAULT 5000.00,
  qr_code VARCHAR(255),
  service VARCHAR(100) DEFAULT 'Consultation générale',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rendez_vous (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  date_heure DATETIME NOT NULL,
  statut ENUM('planifie','confirme','en_cours','termine','annule') DEFAULT 'planifie',
  motif TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT,
  type_analyse VARCHAR(150) NOT NULL,
  statut ENUM('demande','en_cours','termine','annule') DEFAULT 'demande',
  resultat_url VARCHAR(500),
  resultat_texte TEXT,
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_resultat TIMESTAMP NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ordonnances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  medicaments JSON NOT NULL,
  instructions TEXT,
  statut ENUM('active','delivree','expiree') DEFAULT 'active',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  description TEXT,
  stock INT DEFAULT 0,
  prix DECIMAL(10,2) NOT NULL,
  seuil_alerte INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordonnance_id INT,
  medicament_id INT NOT NULL,
  pharmacien_id INT,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  prix_total DECIMAL(10,2) NOT NULL,
  date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ordonnance_id) REFERENCES ordonnances(id) ON DELETE SET NULL,
  FOREIGN KEY (medicament_id) REFERENCES medicaments(id),
  FOREIGN KEY (pharmacien_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS caisse_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  caissier_id INT NOT NULL,
  fonds_initial DECIMAL(12,2) DEFAULT 0,
  solde_final DECIMAL(12,2) NULL,
  solde_reel DECIMAL(12,2) NULL,
  ecart DECIMAL(12,2) NULL,
  statut ENUM('ouverte','cloturee') DEFAULT 'ouverte',
  date_ouverture TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_cloture TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (caissier_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS factures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(30) NOT NULL UNIQUE,
  patient_id INT,
  patient_nom VARCHAR(200),
  caissier_id INT,
  montant_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  montant_paye DECIMAL(12,2) NOT NULL DEFAULT 0,
  statut ENUM('impayee','partielle','payee','annulee') DEFAULT 'impayee',
  source ENUM('auto','manuelle') DEFAULT 'manuelle',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_paiement_complet TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (caissier_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS facture_lignes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facture_id INT NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  type_service ENUM('consultation','analyse','pharmacie','autre') DEFAULT 'autre',
  montant DECIMAL(12,2) NOT NULL,
  reference_id INT NULL,
  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facture_id INT,
  caissier_id INT NOT NULL,
  caisse_session_id INT,
  patient_id INT,
  patient_nom VARCHAR(200),
  libelle VARCHAR(200) NOT NULL,
  type_service ENUM('consultation','analyse','pharmacie','autre') DEFAULT 'autre',
  montant DECIMAL(12,2) NOT NULL,
  mode_paiement ENUM('especes','wave','orange_money','free_money','carte_bancaire') NOT NULL,
  type_operation ENUM('encaissement','remboursement','correction') DEFAULT 'encaissement',
  statut ENUM('succes','echec','annule') DEFAULT 'succes',
  reference_transaction VARCHAR(100),
  motif_annulation TEXT,
  valide_par_admin BOOLEAN DEFAULT FALSE,
  date_transaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE SET NULL,
  FOREIGN KEY (caissier_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (caisse_session_id) REFERENCES caisse_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  titre VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('rdv','analyse','ticket','ordonnance','systeme') DEFAULT 'systeme',
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Données de démonstration
INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES
('admin@hopital.com', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'admin', 'Admin', 'Système', '0000000000'),
('medecin@hopital.com', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'medecin', 'Dupont', 'Jean', '0611111111'),
('patient@hopital.com', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'patient', 'Martin', 'Sophie', '0622222222'),
('labo@hopital.com', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'laborantin', 'Bernard', 'Marie', '0633333333'),
('pharma@hopital.com', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'pharmacien', 'Leroy', 'Paul', '0644444444'),
('reception@hopital.com', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'receptionniste', 'Petit', 'Anne', '0655555555');
-- Mot de passe démo pour tous: password123

INSERT INTO medecins (user_id, specialite) VALUES (2, 'Médecine générale');
INSERT INTO patients (user_id, date_naissance, sexe, allergies, qr_code) VALUES (3, '1990-05-15', 'F', 'Pénicilline', 'PAT-3-ABC123');

INSERT INTO medicaments (nom, description, stock, prix, seuil_alerte) VALUES
('Paracétamol 500mg', 'Antalgique', 500, 500.00, 50),
('Amoxicilline 1g', 'Antibiotique', 200, 2500.00, 30),
('Ibuprofène 400mg', 'Anti-inflammatoire', 15, 800.00, 20);

INSERT INTO disponibilites_medecins (medecin_id, jour_semaine, heure_debut, heure_fin) VALUES
(1, 1, '08:00', '12:00'), (1, 1, '14:00', '18:00'),
(1, 2, '08:00', '12:00'), (1, 3, '08:00', '12:00'),
(1, 4, '08:00', '12:00'), (1, 5, '08:00', '12:00');

-- ═══════════════════════════════════════════════════════════════
-- Établissements, paramètres système, salles & guichets
-- (prérequis des tables lits / tickets.salle_id)
-- ═══════════════════════════════════════════════════════════════
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

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  nom_hopital VARCHAR(200) NOT NULL DEFAULT 'MedikaSN',
  slogan VARCHAR(255) DEFAULT 'N°1 de la santé digitale au Sénégal',
  adresse TEXT,
  telephone VARCHAR(30),
  email VARCHAR(255),
  ticket_duree_minutes INT NOT NULL DEFAULT 120,
  ticket_prix DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  temps_attente_moyen_min INT NOT NULL DEFAULT 8,
  annonce_repetitions INT NOT NULL DEFAULT 3,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_settings (id, nom_hopital, slogan, adresse, telephone, email)
VALUES (1, 'MedikaSN', 'N°1 de la santé digitale au Sénégal',
  'Avenue Cheikh Anta Diop, Plateau — Dakar, Sénégal', '+221 33 800 00 00', 'contact@medikasn.sn');

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

-- ═══════════════════════════════════════════════════════════════
-- Certificats médicaux
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS certificats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  type ENUM('arret_travail','aptitude','consultation','hospitalisation','deces','autre') NOT NULL,
  numero VARCHAR(30) NOT NULL UNIQUE,
  date_examen DATE NOT NULL,
  date_debut DATE NULL,
  date_fin DATE NULL,
  nombre_jours INT NULL,
  contenu TEXT NOT NULL,
  conclusion TEXT NULL,
  lieu VARCHAR(100) NULL,
  date_emission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════
-- Lits & hospitalisation
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
-- Assurances / tiers payant
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  type ENUM('assurance_sante','mutuelle','ipm','cnss','autre') DEFAULT 'assurance_sante',
  telephone VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  adresse TEXT NULL,
  taux_couverture DECIMAL(5,2) DEFAULT 80.00,
  plafond_annuel DECIMAL(12,2) NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_assurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  assurance_id INT NOT NULL,
  numero_adherent VARCHAR(100) NOT NULL,
  taux_couverture DECIMAL(5,2) NULL,
  date_debut DATE NULL,
  date_fin DATE NULL,
  statut ENUM('actif','expire','suspendu') DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assurance_id) REFERENCES assurances(id) ON DELETE CASCADE
);

INSERT IGNORE INTO assurances (id, nom, type, telephone, taux_couverture) VALUES
(1, 'IPM Sénégal', 'ipm', '+221 33 823 45 67', 80.00),
(2, 'CNSS Sénégal', 'cnss', '+221 33 839 50 50', 70.00),
(3, 'Allianz Sénégal', 'assurance_sante', '+221 33 869 70 00', 90.00);

-- ═══════════════════════════════════════════════════════════════
-- Index de performance
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_tickets_patient ON tickets (patient_id);
CREATE INDEX idx_tickets_statut_date ON tickets (statut, created_at);
CREATE INDEX idx_rdv_patient ON rendez_vous (patient_id);
CREATE INDEX idx_rdv_medecin_date ON rendez_vous (medecin_id, date_heure);
CREATE INDEX idx_analyses_patient ON analyses (patient_id);
CREATE INDEX idx_analyses_statut ON analyses (statut);
CREATE INDEX idx_ordonnances_patient ON ordonnances (patient_id);
CREATE INDEX idx_historique_patient ON historique_medical (patient_id);
CREATE INDEX idx_factures_patient ON factures (patient_id);
CREATE INDEX idx_factures_statut_date ON factures (statut, date_creation);
CREATE INDEX idx_transactions_session ON transactions (caisse_session_id);
CREATE INDEX idx_transactions_date ON transactions (date_transaction);
CREATE INDEX idx_notifications_user_lu ON notifications (user_id, lu);
CREATE INDEX idx_certificats_patient ON certificats (patient_id);
CREATE INDEX idx_lits_statut ON lits (statut);
CREATE INDEX idx_hospitalisations_patient ON hospitalisations (patient_id);
CREATE INDEX idx_hospitalisations_statut ON hospitalisations (statut);
CREATE INDEX idx_patient_assurances_patient ON patient_assurances (patient_id);
