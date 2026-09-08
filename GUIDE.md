# Guide du Projet — Plateforme Hospitalière

Documentation de référence pour le développement de la plateforme de gestion d'hôpital / clinique.

---

## 1. Objectif du projet

Créer une **plateforme mobile moderne** permettant de digitaliser la gestion d'un hôpital ou d'une clinique.

### Objectifs principaux

| Objectif | Description |
|----------|-------------|
| Réduire les files d'attente | File d'attente intelligente avec numéro de ticket |
| Faciliter les rendez-vous | Réservation en ligne, calendrier, disponibilités |
| Centraliser les données médicales | Dossier médical numérique |
| Simplifier la communication | Patient ↔ médecin, notifications |
| Gérer tickets et consultations | QR Code, historique |
| Moderniser les services | Interface fluide et professionnelle |

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| **Plateforme Web** | React + Vite (`web/`) |
| **Application Mobile** | Expo SDK 54 + React Native (`frontend/`) |
| **Backend** | Node.js (Express) |
| **Base de données** | MySQL |

### Bibliothèques recommandées (frontend)

- **UI** : React Native Paper, NativeWind (Tailwind)
- **Navigation** : React Navigation
- **Icônes** : Lucide Icons, React Native Vector Icons
- **Animations** : React Native Reanimated, Lottie
- **Graphiques** : React Native Chart Kit
- **Notifications** : Firebase Cloud Messaging (FCM)

### Outils design

- **Figma** (gratuit) — maquettes et design system
- Palette : bleu médical, blanc, gris clair, cartes avec ombres douces

---

## 3. Vision du design

- Moderne, professionnel, fluide, minimaliste, élégant, responsive
- **Couleurs** : bleu médical `#2563EB`, blanc `#FFFFFF`, gris clair `#F1F5F9`
- Cartes modernes, ombres douces, icônes professionnelles, animations légères

---

## 4. Acteurs et rôles

| Rôle | Code | Permissions principales |
|------|------|-------------------------|
| Patient | `patient` | Compte, tickets, RDV, analyses, ordonnances, PDF, notifications |
| Médecin | `medecin` | RDV, dossiers, diagnostic, prescriptions, demandes d'analyses |
| Laborantin | `laborantin` | Analyses demandées, résultats, import PDF, validation |
| Pharmacien | `pharmacien` | Ordonnances, stock, ventes |
| Réceptionniste | `receptionniste` | Enregistrement patients, RDV, tickets, reçus |
| Administrateur | `admin` | Utilisateurs, statistiques, rôles, supervision |

---

## 5. Modules principaux

### Gestion des patients
- Création dossier, historique médical, allergies, informations personnelles

### Gestion des tickets
- Achat consultation, numéro ticket, QR Code, historique

### Gestion des rendez-vous
- Réservation, calendrier, disponibilités médecins, notifications

### Gestion des analyses
- Prescription, résultats PDF, historique, suivi statut

### Gestion pharmacie
- Stock, alertes rupture, ventes, historique

### Dashboard & statistiques
- Patients, RDV du jour, analyses en attente, stock, revenus journaliers

### Notifications
- Rendez-vous, résultats disponibles, rappels consultations

---

## 6. Workflow principal

```
1. Patient crée un compte
        ↓
2. Prend un RDV ou achète un ticket
        ↓
3. Médecin consulte le patient
        ↓
4. Médecin prescrit médicaments OU demande analyses
        ↓
5. Laboratoire ajoute les résultats
        ↓
6. Patient consulte les résultats
        ↓
7. Pharmacien délivre les médicaments
```

---

## 7. Fonctionnalités clés

- **QR Code patient** — identification rapide
- **Dossier médical numérique** — historique complet
- **File d'attente intelligente** — affichage du numéro
- **Génération PDF** — ordonnances et analyses
- **Notifications temps réel** — RDV et analyses

---

## 8. Sécurité (données médicales)

- Authentification **JWT**
- Mots de passe hashés (**bcrypt**)
- Gestion des rôles (RBAC)
- Protection des données sensibles
- Historique des actions (audit log)

---

## 9. Structure du dépôt

```
gestion_hopital/
├── GUIDE.md
├── backend/          API Node.js + MySQL
├── web/              Plateforme Web (navigateur)
├── frontend/         App Mobile (Expo)
└── README.md
```

---

## 10. Démarrage rapide

### Prérequis

- Node.js 18+
- MySQL 8+
- React Native CLI ou Expo
- Android Studio / Xcode (émulateurs)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
npm run dev
```

API par défaut : `http://localhost:3000`

### Plateforme Web

```bash
cd web
npm install
npm run dev
```

Ouvrir http://localhost:5173

### Application Mobile

```bash
cd frontend
npm install
npm run dev
```

Expo Go **SDK 54** requis. Sur téléphone : configurer `API_URL` dans `frontend/src/constants/config.js`.

---

## 11. Variables d'environnement (backend)

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (défaut 3000) |
| `DB_HOST` | Hôte MySQL |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe |
| `DB_NAME` | Nom de la base |
| `JWT_SECRET` | Clé secrète JWT |
| `JWT_EXPIRES_IN` | Durée du token (ex. `7d`) |

---

## 12. État d'implémentation

1. [x] Schéma MySQL (`backend/database/schema.sql`)
2. [x] Authentification JWT + rôles (6 rôles)
3. [x] CRUD patients et dossiers médicaux
4. [x] Module tickets + QR Code
5. [x] Module rendez-vous + notifications
6. [x] Module analyses + upload PDF
7. [x] Module pharmacie (stock, ventes)
8. [x] Dashboard admin / réception
9. [x] App mobile Expo SDK 54 (écrans par rôle)
10. [x] Plateforme Web React (écrans par rôle, sidebar)
11. [ ] Intégration FCM (notifications push)
11. [ ] Tests automatisés et déploiement production

### Comptes de démonstration

| Email | Rôle | Mot de passe |
|-------|------|--------------|
| fatou.fall@hopital.sn | Patient (Fatou Fall) | password123 |
| dr.ndiaye@hopital.sn | Médecin (Dr. Ndiaye) | password123 |
| labo@hopital.sn | Laborantin | password123 |
| pharma@hopital.sn | Pharmacien | password123 |
| reception@hopital.sn | Réception | password123 |
| admin@hopital.sn | Admin | password123 |

Données démo : `npm run seed` dans `backend/` (contexte Sénégal — Dakar, FCFA, noms locaux).

---

## 13. Conventions de code

- **Backend** : camelCase (JS), routes REST (`/api/v1/...`)
- **Frontend** : composants PascalCase, écrans par rôle dans `screens/`
- **Commits** : messages clairs en français ou anglais (`feat:`, `fix:`, `docs:`)

---

*Plateforme Hospitalière — Documentation v1.0*
