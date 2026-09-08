# Backend — Plateforme Hospitalière

API REST Node.js + Express + MySQL.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

## Structure

- `src/config/` — base de données, variables
- `src/controllers/` — logique des endpoints
- `src/middleware/` — auth JWT, rôles, erreurs
- `src/models/` — accès MySQL
- `src/routes/` — routes API
- `src/services/` — métier (tickets, PDF, notifications)
- `src/utils/` — helpers

Voir [GUIDE.md](../GUIDE.md) pour la documentation complète.
