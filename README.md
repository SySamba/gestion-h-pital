# MedikaSN — Plateforme Hospitalière

Solution professionnelle Web + Mobile pour digitaliser cliniques et hôpitaux au **Sénégal**.

> Voir [PRESENTATION.md](PRESENTATION.md) pour la présentation commerciale.

## Architecture

```
gestion_hopital/
├── backend/     API REST (Node.js + MySQL)     → http://localhost:3000
├── web/         Plateforme Web (React + Vite)  → http://localhost:5173
├── frontend/    App Mobile (Expo SDK 54)      → Expo Go
├── GUIDE.md     Documentation
└── README.md
```

| Canal            | Technologie               | Usage                                |
| ---------------- | ------------------------- | ------------------------------------ |
| **Web**    | React + Vite              | Bureau, réception, admin, médecins |
| **Mobile** | Expo / React Native       | Patients, personnel en déplacement  |
| **API**    | Node.js + Express + MySQL | Données partagées                  |

## Démarrage

### 1. Base de données

```bash
mysql -u root -p < backend/database/schema.sql
cd backend
npm run seed
```

Le script `seed` charge des données sénégalaises (patients, tickets, RDV, analyses, etc.).

### 2. Backend (obligatoire)

```bash
cd backend
npm install
npm run dev
```

### 3. Plateforme Web (navigateur)

```bash
cd web
npm install
npm run dev
```

Ouvrez **http://localhost:5173**

### 4. Application Mobile (Expo Go SDK 54)

```bash
cd frontend
npm install
npm run dev
```

Scannez le QR code avec **Expo Go** (version SDK 54).

> Sur téléphone physique : modifiez `API_URL` dans `frontend/src/constants/config.js` avec l'IP de votre PC.

## Comptes démo

Mot de passe : **password123**

| Email                 | Rôle                         |
| --------------------- | ----------------------------- |
| admin@hopital.sn      | Administrateur (Mamadou Sarr) |
| dr.ndiaye@hopital.sn  | Médecin (Dr. Aminata Ndiaye) |
| fatou.fall@hopital.sn | Patient (Fatou Fall, Dakar)   |
| reception@hopital.sn  | Réception (Awa Cissé)       |
| labo@hopital.sn       | Laboratoire (Khady Gueye)     |
| pharma@hopital.sn     | Pharmacie (Cheikh Mbaye)      |

## Modules

- Patients, dossier médical, QR Code
- Tickets et file d'attente
- Rendez-vous
- Analyses laboratoire
- Ordonnances et pharmacie
- Dashboard statistiques
- Notifications
