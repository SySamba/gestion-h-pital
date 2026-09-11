import { useEffect, useState } from 'react';
import './InstallPrompt.css';

function isIOs() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function isDesktop() {
  return !isIOs() && !isAndroid();
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    const hidden = localStorage.getItem('medikasn-install-dismissed');
    if (isIOs() && !hidden && !installed) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [installed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('medikasn-install-dismissed', '1');
  };

  if (!visible || dismissed || installed) return null;

  const iOS = isIOs();
  const android = isAndroid();
  const desktop = isDesktop();

  return (
    <div className="install-prompt" role="banner" aria-live="polite">
      <div className="install-prompt-content">
        <div className="install-prompt-text">
          <strong>Installez MedikaSN</strong>
          {iOS && <span>Appuyez sur <span className="install-icon">Partager</span> puis « Ajouter à l&apos;écran d&apos;accueil ».</span>}
          {android && <span>Ajoutez MedikaSN à votre écran d&apos;accueil pour un accès rapide.</span>}
          {desktop && <span>Installez MedikaSN comme une application sur votre ordinateur.</span>}
        </div>
        <div className="install-prompt-actions">
          {deferredPrompt && (
            <button type="button" className="install-prompt-btn" onClick={handleInstall}>
              Installer
            </button>
          )}
          <button type="button" className="install-prompt-close" onClick={handleDismiss} aria-label="Fermer">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
