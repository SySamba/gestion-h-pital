import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { STATUT_APPEL_FR } from '../utils/labels';
import '../components/PaymentModal.css';

export default function MyQueue() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const load = useCallback(() => {
    api.getMyQueuePosition().then((r) => setData(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const sendSos = async () => {
    if (sosLoading) return;
    setSosLoading(true);
    try {
      await api.createUrgenceAlert({
        message: 'Demande d\'assistance urgente depuis la salle d\'attente',
        localisation: 'Salle d\'attente',
      });
      setSosSent(true);
      toast('Alerte urgence envoyée — un agent va vous assister');
      setTimeout(() => setSosSent(false), 60000);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSosLoading(false);
    }
  };

  const ticket = data?.ticket;

  return (
    <div>
      <PageHeader
        title="Ma file d'attente"
        subtitle="Suivi en temps réel — actualisation automatique toutes les 5 secondes"
      />

      <div className="sos-panel">
        <div>
          <strong>🆘 Besoin d'aide urgente ?</strong>
          <p className="form-hint" style={{ margin: '4px 0 0' }}>
            Malaise, difficulté à marcher, assistance immédiate — alertez le personnel à tout moment.
          </p>
        </div>
        <button
          type="button"
          className={`btn btn-sos ${sosSent ? 'btn-sos-sent' : ''}`}
          onClick={sendSos}
          disabled={sosLoading || sosSent}
        >
          {sosSent ? '✓ Alerte envoyée' : sosLoading ? 'Envoi...' : 'Secours / Urgence'}
        </button>
      </div>

      {!ticket ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 48, margin: 0 }}>🎫</p>
          <h3>Aucun ticket actif</h3>
          <p className="form-hint">Achetez un ticket pour rejoindre la file d'attente</p>
          <a href="/app/tickets" className="btn btn-primary">Acheter un ticket</a>
        </div>
      ) : (
        <>
          <div className="queue-position-card">
            {ticket.statut === 'en_cours' ? (
              <>
                <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 18 }}>🔔 C'est votre tour !</p>
                <div className="position-num">{ticket.numero}</div>
                <p>
                  Présentez-vous {ticket.salle ? `à ${ticket.salle}` : 'au cabinet médical'}
                  {ticket.medecin_appel ? ` — ${ticket.medecin_appel}` : ''}
                </p>
              </>
            ) : ticket.statut_appel === 'appele' ? (
              <>
                <p style={{ color: '#ea580c', fontWeight: 700, fontSize: 18 }}>📢 Vous êtes appelé(e) !</p>
                <div className="position-num">{ticket.numero}</div>
                <p>
                  {STATUT_APPEL_FR.appele}
                  {ticket.salle ? ` — ${ticket.salle}` : ''}
                  {ticket.medecin_appel ? ` · ${ticket.medecin_appel}` : ''}
                </p>
              </>
            ) : (
              <>
                <p>Votre position dans la file</p>
                <div className="position-num">#{data.position}</div>
                <p>Ticket <strong>{ticket.numero}</strong> — {ticket.service}</p>
                <p className="form-hint">Temps d'attente estimé : ~{data.temps_estime_min} minutes</p>
                {data.minutes_avant_expiration != null && (
                  <p style={{ marginTop: 12, color: data.minutes_avant_expiration <= 15 ? '#dc2626' : 'var(--text-muted)' }}>
                    ⏱ Validité du ticket : {data.minutes_avant_expiration} min restantes
                    {data.minutes_avant_expiration <= 15 && ' — présentez-vous rapidement'}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="card">
            <h3>En cours de consultation</h3>
            <p style={{ fontSize: 24, fontWeight: 700 }}>{data.ticket_en_cours || '—'}</p>
          </div>
        </>
      )}
    </div>
  );
}
