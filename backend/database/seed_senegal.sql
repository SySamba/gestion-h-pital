-- Données de démonstration — Contexte Sénégal
-- Mot de passe pour tous les comptes : password123
-- Exécuter après schema.sql : mysql -u root -p gestion_hopital < seed_senegal.sql

USE gestion_hopital;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE transactions;
TRUNCATE TABLE facture_lignes;
TRUNCATE TABLE factures;
TRUNCATE TABLE caisse_sessions;
TRUNCATE TABLE ventes;
TRUNCATE TABLE notifications;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE ordonnances;
TRUNCATE TABLE analyses;
TRUNCATE TABLE rendez_vous;
TRUNCATE TABLE tickets;
TRUNCATE TABLE historique_medical;
TRUNCATE TABLE disponibilites_medecins;
TRUNCATE TABLE medicaments;
TRUNCATE TABLE patients;
TRUNCATE TABLE medecins;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Hash bcrypt pour "password123"
SET @pwd = '$2a$10$J3ct/I2Wzx/L7Me5i1xY9OphQiCf6luDBfbmJjNaK6VroWHUi6kKq';

-- Utilisateurs
INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES
('admin@hopital.sn', @pwd, 'admin', 'Sarr', 'Mamadou', '+221 77 100 00 01'),
('dr.ndiaye@hopital.sn', @pwd, 'medecin', 'Ndiaye', 'Aminata', '+221 77 200 00 02'),
('dr.diop@hopital.sn', @pwd, 'medecin', 'Diop', 'Ibrahima', '+221 77 200 00 03'),
('fatou.fall@hopital.sn', @pwd, 'patient', 'Fall', 'Fatou', '+221 77 301 00 04'),
('moussa.sow@hopital.sn', @pwd, 'patient', 'Sow', 'Moussa', '+221 77 301 00 05'),
('aissatou.ba@hopital.sn', @pwd, 'patient', 'Ba', 'Aissatou', '+221 77 301 00 06'),
('omar.sy@hopital.sn', @pwd, 'patient', 'Sy', 'Omar', '+221 77 301 00 07'),
('labo@hopital.sn', @pwd, 'laborantin', 'Gueye', 'Khady', '+221 77 400 00 08'),
('pharma@hopital.sn', @pwd, 'pharmacien', 'Mbaye', 'Cheikh', '+221 77 500 00 09'),
('reception@hopital.sn', @pwd, 'receptionniste', 'Cissé', 'Awa', '+221 77 600 00 10'),
('caisse@hopital.sn', @pwd, 'caissier', 'Diallo', 'Aminata', '+221 77 700 00 11');

-- Médecins
INSERT INTO medecins (user_id, specialite) VALUES
(2, 'Médecine générale'),
(3, 'Cardiologie');

-- Patients
INSERT INTO patients (user_id, date_naissance, sexe, adresse, groupe_sanguin, allergies, qr_code) VALUES
(4, '1988-03-12', 'F', 'Plateau, Dakar', 'O+', 'Pénicilline', 'PAT-SN-004-FALOU'),
(5, '1975-07-22', 'M', 'Médina, Dakar', 'A+', 'Aucune', 'PAT-SN-005-SOW'),
(6, '1995-11-08', 'F', 'Parcelles Assainies, Dakar', 'B+', 'Arachides', 'PAT-SN-006-BA'),
(7, '2001-01-30', 'M', 'Thiès, Sénégal', 'AB+', 'Aucune', 'PAT-SN-007-SY');

-- Médicaments (prix en FCFA)
INSERT INTO medicaments (nom, description, stock, prix, seuil_alerte) VALUES
('Paracétamol 500mg', 'Antalgique — laboratoire local', 450, 250, 50),
('Amoxicilline 1g', 'Antibiotique', 180, 1500, 30),
('Artéméther-Luméfantrine', 'Antipaludéen', 120, 3500, 25),
('Ibuprofène 400mg', 'Anti-inflammatoire', 8, 500, 20),
('Vitamine B complexe', 'Complément', 200, 1200, 40),
('Sérum physiologique 500ml', 'Perfusion', 90, 800, 15);

-- Disponibilités médecins
INSERT INTO disponibilites_medecins (medecin_id, jour_semaine, heure_debut, heure_fin) VALUES
(1, 1, '08:00', '12:00'), (1, 1, '15:00', '18:00'),
(1, 2, '08:00', '12:00'), (1, 3, '08:00', '12:00'),
(1, 4, '08:00', '12:00'), (1, 5, '08:00', '12:00'),
(2, 2, '09:00', '13:00'), (2, 4, '09:00', '13:00');

-- Tickets (file d'attente)
INSERT INTO tickets (patient_id, numero, statut, prix, qr_code, service, created_at) VALUES
(1, 'TKT-20260521-001', 'termine', 5000, 'TKT-1-001', 'Consultation générale', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 'TKT-20260521-002', 'en_cours', 5000, 'TKT-2-002', 'Consultation générale', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 'TKT-20260521-003', 'en_attente', 7500, 'TKT-3-003', 'Consultation spécialiste', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(4, 'TKT-20260521-004', 'en_attente', 5000, 'TKT-4-004', 'Consultation générale', NOW());

-- Rendez-vous
INSERT INTO rendez_vous (patient_id, medecin_id, date_heure, statut, motif) VALUES
(1, 1, DATE_ADD(CURDATE(), INTERVAL 9 HOUR), 'confirme', 'Contrôle tension artérielle'),
(2, 1, DATE_ADD(CURDATE(), INTERVAL 10 HOUR), 'planifie', 'Fièvre et maux de tête'),
(3, 2, DATE_ADD(CURDATE(), INTERVAL 11 HOUR), 'planifie', 'Douleurs thoraciques'),
(4, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'planifie', 'Bilan de santé annuel'),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'planifie', 'Suivi cardiologique');

-- Historique médical
INSERT INTO historique_medical (patient_id, medecin_id, diagnostic, notes, date_consultation) VALUES
(1, 1, 'Hypertension légère', 'Régime pauvre en sel recommandé. Prochain contrôle dans 1 mois.', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 1, 'Infection respiratoire', 'Repos et hydratation. Antibiotique prescrit.', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(3, 1, 'Migraine', 'Éviter le stress et la déshydratation.', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(4, 1, 'Paludisme suspect', 'TDR positif — traitement antipaludéen initié.', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Analyses
INSERT INTO analyses (patient_id, medecin_id, type_analyse, statut, resultat_texte, date_demande, date_resultat) VALUES
(1, 1, 'Numération formule sanguine (NFS)', 'termine', 'Hémoglobine: 12.8 g/dL — Globules blancs normaux', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 1, 'Glycémie à jeun', 'termine', 'Glycémie: 0.95 g/L — Normal', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 2, 'ECG', 'en_cours', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(4, 1, 'Test Rapide Paludisme (TDR)', 'demande', NULL, NOW(), NULL),
(1, 2, 'Bilan lipidique', 'demande', NULL, NOW(), NULL);

-- Ordonnances
INSERT INTO ordonnances (patient_id, medecin_id, medicaments, instructions, statut, date_creation) VALUES
(1, 1, '[{"nom":"Paracétamol 500mg","dosage":"1 cp x3/j","duree":"5 jours"},{"nom":"Amlodipine 5mg","dosage":"1 cp/j","duree":"30 jours"}]', 'Prendre après les repas. Contrôle tension dans 15 jours.', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 1, '[{"nom":"Amoxicilline 1g","dosage":"1 cp x2/j","duree":"7 jours"},{"nom":"Paracétamol 500mg","dosage":"si fièvre","duree":"7 jours"}]', 'Terminer le traitement antibiotique.', 'delivree', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(4, 1, '[{"nom":"Artéméther-Luméfantrine","dosage":"selon protocole","duree":"3 jours"}]', 'Traitement antipaludéen — boire beaucoup d eau.', 'active', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Ventes pharmacie
INSERT INTO ventes (ordonnance_id, medicament_id, pharmacien_id, quantite, prix_unitaire, prix_total, date_vente) VALUES
(2, 2, 9, 14, 1500, 21000, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 1, 9, 20, 250, 5000, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(NULL, 3, 9, 2, 3500, 7000, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(NULL, 1, 9, 10, 250, 2500, NOW());

-- Notifications
INSERT INTO notifications (user_id, titre, message, type, lu) VALUES
(4, 'Rendez-vous confirmé', 'Votre RDV du matin avec Dr. Ndiaye est confirmé.', 'rdv', FALSE),
(5, 'Ticket en cours', 'Votre ticket TKT est en cours de traitement.', 'ticket', FALSE),
(4, 'Résultats disponibles', 'Vos résultats NFS sont disponibles.', 'analyse', TRUE),
(6, 'Nouvelle ordonnance', 'Une ordonnance antipaludéenne vous a été prescrite.', 'ordonnance', FALSE),
(2, 'Patient en attente', '3 patients en file d attente ce matin.', 'systeme', FALSE),
(10, 'Rappel', '2 rendez-vous prévus aujourd hui à la clinique.', 'rdv', FALSE);

-- Caisse — session de démonstration
INSERT INTO caisse_sessions (caissier_id, fonds_initial, statut, date_ouverture) VALUES
(11, 50000, 'ouverte', NOW());

-- Factures de démonstration
INSERT INTO factures (numero, patient_id, patient_nom, caissier_id, montant_total, montant_paye, statut, date_creation) VALUES
('FAC-20260828-001', 1, 'Fall Fatou', 11, 5000, 5000, 'payee', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('FAC-20260828-002', 2, 'Sow Moussa', 11, 12000, 5000, 'partielle', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('FAC-20260828-003', 3, 'Ba Aissatou', 11, 7500, 0, 'impayee', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- Lignes de facture
INSERT INTO facture_lignes (facture_id, libelle, type_service, montant) VALUES
(1, 'Consultation générale', 'consultation', 5000),
(2, 'Consultation générale', 'consultation', 5000),
(2, 'Glycémie à jeun', 'analyse', 7000),
(3, 'Consultation spécialiste', 'consultation', 7500);

-- Transactions
INSERT INTO transactions (facture_id, caissier_id, caisse_session_id, patient_id, patient_nom, libelle, type_service, montant, mode_paiement, type_operation, statut, date_transaction) VALUES
(1, 11, 1, 1, 'Fall Fatou', 'Consultation générale', 'consultation', 5000, 'especes', 'encaissement', 'succes', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 11, 1, 2, 'Sow Moussa', 'Consultation générale (acompte)', 'consultation', 5000, 'wave', 'encaissement', 'succes', DATE_SUB(NOW(), INTERVAL 1 HOUR));
