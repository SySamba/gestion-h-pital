import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/api';
import { BRAND } from '../constants/branding';
import '../components/PaymentModal.css';

const buildAnnouncement = (ticket, isAppele = false) => {
  if (!ticket) return null;
  const name = ticket.patient_nom_complet || ticket.patient || 'Patient';
  const salle = ticket.salle || ticket.service || 'au cabinet médical';
  const salleLabel = ticket.salle ? ticket.salle : salle;

  return {
    name,
    salle: salleLabel,
    numero: ticket.numero,
    medecin: ticket.medecin || null,
    label: isAppele ? 'Patient appelé' : 'En consultation',
    action: 'Veuillez vous présenter',
  };
};

const REPEAT_PAUSE_MS = 700;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveAudioUrl = (audioUrl) => {
  if (!audioUrl) return null;
  if (audioUrl.startsWith('http')) return audioUrl;
  return `${window.location.origin}${audioUrl}`;
};

const speakBrowserFallback = (text, repeat = 3) => {
  if (!text || !window.speechSynthesis) return Promise.resolve(false);

  return new Promise((resolve) => {
    let count = 0;
    const speakNext = () => {
      if (count >= repeat) {
        resolve(true);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.88;
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith('fr'));
      if (frVoice) utterance.voice = frVoice;
      utterance.onend = () => {
        count += 1;
        if (count < repeat) setTimeout(speakNext, REPEAT_PAUSE_MS);
        else resolve(true);
      };
      utterance.onerror = () => resolve(count > 0);
      window.speechSynthesis.speak(utterance);
    };
    window.speechSynthesis.cancel();
    speakNext();
  });
};

export default function QueueDisplay() {
  const [display, setDisplay] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [ttsStatus, setTtsStatus] = useState(null);
  const [voiceSource, setVoiceSource] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [announceRepeat, setAnnounceRepeat] = useState(3);
  const lastAnnouncedRef = useRef(null);
  const audioRef = useRef(null);
  const playTokenRef = useRef(0);
  const playingRef = useRef(false);

  const stopCurrentAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.src = '';
    audioRef.current = null;
  };

  const playAudioUrl = useCallback(async (audioUrl) => {
    const url = resolveAudioUrl(audioUrl);
    if (!url) throw new Error('URL audio manquante');

    const token = ++playTokenRef.current;
    stopCurrentAudio();

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = 1;

    try {
      await audio.play();
    } catch (err) {
      if (token !== playTokenRef.current) return;
      throw err;
    }

    await new Promise((resolve, reject) => {
      if (token !== playTokenRef.current) {
        resolve();
        return;
      }
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Fichier audio introuvable'));
    });
  }, []);

  const playFromApi = useCallback(async (fetchAudio, ticketForFallback) => {
    if (playingRef.current) return;
    playingRef.current = true;
    setAudioError(null);

    try {
      const res = await fetchAudio();
      const { audioUrl, source, texts, error } = res.data || {};

      if (audioUrl) {
        setVoiceSource(source === 'cache' ? 'edge-tts' : source);
        for (let i = 0; i < announceRepeat; i += 1) {
          await playAudioUrl(audioUrl);
          if (i < announceRepeat - 1) await sleep(REPEAT_PAUSE_MS);
        }
        return;
      }

      setVoiceSource('browser');
      const fallbackText = texts?.french || texts?.speech
        || `${ticketForFallback?.patient_nom_complet || ticketForFallback?.patient || 'Patient'}, veuillez vous présenter à la ${ticketForFallback?.salle || 'salle d\'attente'}.`;
      const spoken = await speakBrowserFallback(fallbackText, announceRepeat);
      if (!spoken) {
        throw new Error(error || 'Aucune voix disponible');
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setVoiceSource('browser');
      const msg = err?.message || 'Erreur lecture audio';
      if (!msg.includes('interrupted')) {
        setAudioError(msg);
      }
    } finally {
      playingRef.current = false;
    }
  }, [playAudioUrl, announceRepeat]);

  const playAnnouncement = useCallback(async (ticket) => {
    if (!audioEnabled || !ticket) return;
    await playFromApi(() => api.getAnnounceAudio(ticket.numero), ticket);
  }, [audioEnabled, playFromApi]);

  useEffect(() => {
    api.getTtsStatus().then((r) => setTtsStatus(r.data)).catch(() => {});
    api.getSettings().then((r) => {
      const reps = r.data?.annonce_repetitions;
      if (reps >= 1 && reps <= 5) setAnnounceRepeat(reps);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const load = () => api.getQueueDisplay().then((r) => setDisplay(r.data)).catch(() => {});
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!audioEnabled || !display) return;

    const active = display?.appele || display?.en_cours;
    if (!active) return;
    if (active.statut_appel !== 'appele' && active.statut_appel !== 'en_consultation') return;

    const key = `${active.numero}-${active.statut_appel}-${active.appele_at || active.numero}`;
    if (lastAnnouncedRef.current === key) return;
    lastAnnouncedRef.current = key;

    playAnnouncement(active);
  }, [audioEnabled, display, playAnnouncement]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => {
    playTokenRef.current += 1;
    stopCurrentAudio();
  }, []);

  const active = display?.appele || display?.en_cours;
  const announcement = buildAnnouncement(active, Boolean(display?.appele));
  const timeStr = clock.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const enableAudio = () => {
    setAudioEnabled(true);
    lastAnnouncedRef.current = null;
  };

  return (
    <div className="display-screen">
      {!audioEnabled && (
        <div className="display-audio-unlock">
          <button type="button" className="btn btn-sos display-audio-btn" onClick={enableAudio}>
            🔊 Activer la voix
          </button>
          <p className="form-hint">Cliquez une fois pour autoriser le son du navigateur</p>
        </div>
      )}

      <header className="display-header">
        <div className="display-brand">
          <span className="display-brand-icon">🏥</span>
          <div>
            <h1>{BRAND.name}</h1>
            <p>Salle d'attente</p>
          </div>
        </div>
        <div className="display-header-right">
          {ttsStatus?.edge_tts && (
            <span className="display-tts-badge tts-on">🔊 Voix française</span>
          )}
          <div className="display-clock">{timeStr}</div>
        </div>
      </header>

      {audioError && <p className="display-audio-error">{audioError}</p>}

      <section className="display-announce">
        {!announcement ? (
          <div className="display-announce-empty">
            <p className="display-announce-wait">En attente du prochain appel</p>
            <div className="display-panel-num display-panel-num-muted">—</div>
          </div>
        ) : (
          <>
            <p className="display-announce-label">{announcement.label}</p>
            <h2 className="display-announce-name">{announcement.name}</h2>
            <p className="display-announce-action">{announcement.action}</p>
            <div className="display-announce-salle">🚪 {announcement.salle}</div>
            {announcement.medecin && (
              <p className="display-announce-medecin">👨‍⚕️ {announcement.medecin}</p>
            )}
            <p className="display-announce-ticket">Ticket {announcement.numero}</p>
            {voiceSource === 'edge-tts' && (
              <p className="display-voice-tag">Annonce vocale en français</p>
            )}
          </>
        )}
      </section>

      <footer className="display-footer">
        Annonce répétée {announceRepeat} fois · Actualisation automatique
      </footer>
    </div>
  );
}
