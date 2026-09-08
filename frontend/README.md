# Application Mobile — Plateforme Hospitalière

Application mobile **Expo SDK 54** pour patients, médecins, laboratoire, pharmacie, réception et administration.

> La **plateforme web** est dans le dossier `../web/`

## Installation

```bash
npm install
npx react-native start
npx react-native run-android
```

## Structure

- `src/screens/` — écrans par module et rôle
- `src/components/` — composants réutilisables (cartes, boutons, etc.)
- `src/navigation/` — React Navigation
- `src/services/` — appels API, auth, notifications
- `src/constants/` — couleurs, config API
- `src/hooks/` — hooks personnalisés
- `src/assets/` — images, icônes

## Design

- Bleu médical, blanc, gris clair
- React Native Paper pour l'UI

Voir [GUIDE.md](../GUIDE.md) pour la documentation complète.
