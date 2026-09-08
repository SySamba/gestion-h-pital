# Setup Wolof TTS pour Windows (MedikaSN)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Target = Join-Path $Root "services\wolof-tts"
$Zip = Join-Path $Target "galsenai-xtts-wo-checkpoints.zip"
$Repo = "https://github.com/sudoping01/wolof-tts.git"

Write-Host "=== MedikaSN — Installation voix wolof GalsenAI ===" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "ERREUR: Git n'est pas installé. Installez Git for Windows." -ForegroundColor Red
  exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "AVERTISSEMENT: Docker n'est pas dans le PATH." -ForegroundColor Yellow
  Write-Host "Installez Docker Desktop et redémarrez le terminal." -ForegroundColor Yellow
  Write-Host "En attendant, le backend utilisera Edge TTS (voix intégrée, sans Docker)." -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $Target "app.py"))) {
  Write-Host "Clonage du dépôt wolof-tts..." -ForegroundColor Yellow
  if (Test-Path $Target) { Remove-Item $Target -Recurse -Force }
  New-Item -ItemType Directory -Path (Split-Path $Target) -Force | Out-Null
  git clone $Repo $Target
  Write-Host "Clone terminé." -ForegroundColor Green
} else {
  Write-Host "Dépôt wolof-tts déjà présent." -ForegroundColor Green
}

if (-not (Test-Path $Zip)) {
  Write-Host ""
  Write-Host "ACTION REQUISE — Téléchargez le modèle GalsenAI (~1 Go) :" -ForegroundColor Red
  Write-Host "  https://drive.google.com/uc?id=1jsGAMBo354uRhwVKNnuJpLtq2uJYcVHN" -ForegroundColor White
  Write-Host ""
  Write-Host "Enregistrez le fichier ici :" -ForegroundColor Yellow
  Write-Host "  $Zip" -ForegroundColor White
  Write-Host ""
  Write-Host "Puis relancez :" -ForegroundColor Yellow
  Write-Host "  docker compose -f docker-compose.tts.yml up -d --build" -ForegroundColor White
  exit 0
}

Write-Host "Checkpoint trouvé. Lancement du build Docker..." -ForegroundColor Green
Set-Location $Root
docker compose -f docker-compose.tts.yml up -d --build

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Voix wolof GalsenAI active sur http://localhost:8080" -ForegroundColor Green
  Write-Host "Test: curl http://localhost:8080/health" -ForegroundColor Gray
} else {
  Write-Host "Build Docker échoué. Utilisez Edge TTS (backend) en attendant." -ForegroundColor Yellow
}
