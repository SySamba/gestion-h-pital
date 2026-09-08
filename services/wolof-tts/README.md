# Service Wolof TTS (GalsenAI)

Ce dossier est rempli par le script `scripts/setup-wolof-tts.ps1`.

## Prérequis

1. **Docker Desktop** installé et démarré (Windows)
2. **Git** installé
3. **Checkpoint modèle** (~1 Go) — téléchargement manuel obligatoire

## Installation (Windows)

```powershell
cd C:\Users\HP\OneDrive\Bureau\gestion_hopital
powershell -ExecutionPolicy Bypass -File scripts\setup-wolof-tts.ps1
```

Puis construire et lancer :

```powershell
docker compose -f docker-compose.tts.yml up -d --build
```

## Télécharger le modèle GalsenAI

Si le script le signale, téléchargez le fichier checkpoint :

https://drive.google.com/uc?id=1jsGAMBo354uRhwVKNnuJpLtq2uJYcVHN

Enregistrez-le sous :

`services/wolof-tts/galsenai-xtts-wo-checkpoints.zip`

Puis relancez `docker compose -f docker-compose.tts.yml up -d --build`.

## Vérification

```powershell
curl http://localhost:8080/health
```

## Sans Docker

MedikaSN utilise automatiquement **Edge TTS** (intégré au backend Node.js) — voix française naturelle pour les annonces wolof/français mixées.  
Pour la voix wolof 100 % GalsenAI, Docker + checkpoint reste nécessaire.
