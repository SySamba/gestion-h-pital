# MedikaSN v3.0 — Présentation commerciale

## Pitch (30 secondes)

**MedikaSN v3** est la plateforme tout-en-un la plus complète pour digitaliser cliniques et hôpitaux au Sénégal : dossier patient lisible, consultation médicale guidée, file d'attente, laboratoire, pharmacie et tableau de bord — **Web + Mobile**, interface premium, 100 % en français.

---

## Proposition de valeur

| Problème | Solution MedikaSN |
|----------|-------------------|
| Files d'attente chaotiques | Tickets numérotés + QR + file temps réel |
| Dossiers papier perdus | Dossier médical numérique centralisé |
| RDV par téléphone | Réservation en ligne + calendrier médecins |
| Résultats analyses retardés | Notifications + suivi statut laboratoire |
| Stock pharmacie opaque | Alertes rupture + ventes + ordonnances liées |
| Pas de vision direction | Dashboard revenus FCFA, activité, rapports |

---

## Canaux

- **Web** (http://localhost:5173) — Réception, admin, médecins, pharmacie
- **Mobile** (Expo) — Patients et personnel nomade
- **API REST** sécurisée JWT — Intégration future (assurance, SMS Orange/Sonatel)

---

## Différenciateurs pour la vente

1. **Contexte Sénégal** — Noms, adresses Dakar, FCFA, +221
2. **6 rôles** — Patient, médecin, labo, pharmacien, réception, admin
3. **Marque MedikaSN** — Landing page marketing incluse
4. **Démo immédiate** — `npm run seed` + comptes prêts
5. **Stack moderne** — React, Node.js, MySQL (hébergement flexible)

---

## Tarification indicative (à adapter)

| Offre | Cible | Contenu |
|-------|-------|---------|
| **Starter** | Petite clinique | Web + 50 patients, 3 utilisateurs |
| **Pro** | Clinique moyenne | Web + Mobile, illimité, support |
| **Enterprise** | Hôpital / réseau | Multi-sites, API, formation |

---

## Démo en 3 étapes

```bash
# 1. Base + données Sénégal
mysql -u root -p < backend/database/schema.sql
cd backend && npm run seed && npm run dev

# 2. Plateforme Web
cd web && npm run dev
# → http://localhost:5173

# 3. Mobile
cd frontend && npm run dev
```

**Compte démo admin :** admin@hopital.sn / password123

---

## Roadmap vendeur (extensions payantes)

- SMS rappels RDV (API Orange)
- Paiement Mobile Money (Wave, Orange Money)
- Impression tickets / reçus PDF
- Multi-établissements (franchise)
- Hébergement cloud managé

---

*MedikaSN v2.0 — Plateforme Hospitalière Professionnelle*
