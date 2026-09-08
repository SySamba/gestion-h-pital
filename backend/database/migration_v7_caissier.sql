-- Migration v7 — Rôle Caissier : caisse_sessions, factures, transactions, remboursements
USE gestion_hopital;

-- 1. Ajouter le rôle 'caissier' dans l'ENUM users
ALTER TABLE users MODIFY COLUMN role ENUM('patient','medecin','laborantin','pharmacien','receptionniste','caissier','admin') NOT NULL DEFAULT 'patient';

-- 1b. Ajouter colonne source à factures (si table déjà existante)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS source ENUM('auto','manuelle') DEFAULT 'manuelle' AFTER statut;

-- 2. Sessions de caisse
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

-- 3. Factures
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

-- 4. Lignes de facture (détail des services)
CREATE TABLE IF NOT EXISTS facture_lignes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facture_id INT NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  type_service ENUM('consultation','analyse','pharmacie','autre') DEFAULT 'autre',
  montant DECIMAL(12,2) NOT NULL,
  reference_id INT NULL,
  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
);

-- 5. Transactions (encaissements)
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

-- 6. Compte caissier de démonstration
INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES
('caisse@hopital.sn', '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq', 'caissier', 'Diallo', 'Aminata', '+221 77 700 00 11')
ON DUPLICATE KEY UPDATE email = email;
