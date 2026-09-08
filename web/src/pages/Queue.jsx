import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { PRIORITE_FR } from '../utils/labels';
import './ReceptionPages.css';

const PRIORITE_CLASS = {
  normale: 'priorite-normale',
  urgente: 'priorite-urgente',
  tres_urgente: 'priorite-tres_urgente',
};

const FALLBACK_SALLES = ['Salle 1', 'Salle 2', 'Salle 3', 'Cabinet A', 'Cabinet B', 'Box Urgences'];

export default function Queue() {
  const { toast } = useToast();
  const [queue, setQueue] = useState([]);
  const [live, setLive] = useState(null);
  const [salles, setSalles] = useState(FALLBACK_SALLES);
  const [callModal, setCallModal] = useState(null);
  const [callForm, setCallForm] = useState({
    salle: FALLBACK_SALLES[0],
    medecin_appel: '',
    mode: 'appele',
  });

  const load = useCallback(() => {
    Promise.all([
      api.getQueueLive().catch(() => null),
      api.getQueue().catch(() => ({ data: [] })),
      api.getSallesActives().catch(() => null),
    ]).then(([l, q, s]) => {
      if (l) setLive(l.data);
      setQueue(q.data || []);
      if (s?.data?.length) {
        const names = s.data.map((x) => x.nom);
        setSalles(names);
        setCallForm((prev) => ({ ...prev, salle: prev.salle || names[0] }));
      }
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const openCallModal = (ticket) => {
    setCallModal(ticket);
    setCallForm({
      salle: ticket.salle || salles[0] || FALLBACK_SALLES[0],
      medecin_appel: ticket.medecin_appel || '',
      mode: 'appele',
    });
  };

  const confirmCall = async (mode) => {
    if (!callModal) return;
    try {
      const body = {
        salle: callForm.salle,
        medecin_appel: callForm.medecin_appel || null,
      };
      if (mode === 'consultation') {
        body.statut = 'en_cours';
      } else {
        body.statut_appel = 'appele';
      }
      await api.updateTicket(callModal.id, body);
      toast(mode === 'consultation' ? 'Patient en consultation' : 'Patient appelé — affiché sur l\'écran');
      setCallModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const done = (id) =>
    api.updateTicket(id, { statut: 'termine', statut_appel: 'en_attente' }).then(() => {
      toast('Consultation terminée');
      load();
    });

  const setPriority = (id, priorite) =>
    api.updateTicketPriority(id, priorite).then(() => {
      toast(`Priorité: ${PRIORITE_FR[priorite]}`);
      load();
    });

  const enCours = queue.filter((t) => t.statut === 'en_cours');
  const enAttente = queue.filter((t) => t.statut === 'en_attente');

  return (
    <div className="queue-page">
      <PageHeader
        title="File d'attente"
        subtitle="Appel patient · salle · médecin · écran public"
        action={
          <a href="/ecran-attente" target="_blank" rel="noreferrer" className="btn btn-outline">
            📺 Écran salle d'attente
          </a>
        }
      />

      <div className="queue-stats-row">
        <div className="card queue-stat-mini">
          <div className="val">{live?.ticket_en_cours?.numero || '—'}</div>
          <div className="lbl">En cours</div>
        </div>
        <div className="card queue-stat-mini">
          <div className="val">{live?.total_en_attente ?? enAttente.length}</div>
          <div className="lbl">En attente</div>
        </div>
        <div className="card queue-stat-mini">
          <div className="val">~{live?.temps_moyen_min || 8} min</div>
          <div className="lbl">Par patient</div>
        </div>
        <div className="card queue-stat-mini">
          <div className="val">{queue.length}</div>
          <div className="lbl">Total actifs</div>
        </div>
      </div>

      {callModal && (
        <div className="modal-overlay">
          <div className="modal card" style={{ maxWidth: 440 }}>
            <h3>Appeler {callModal.numero}</h3>
            <p className="form-hint">{callModal.prenom} {callModal.nom}</p>
            <label>Salle / Cabinet</label>
            <select
              className="input"
              value={callForm.salle}
              onChange={(e) => setCallForm({ ...callForm, salle: e.target.value })}
            >
              {salles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label>Médecin (optionnel)</label>
            <input
              className="input"
              placeholder="Dr. Diop — Cardiologie"
              value={callForm.medecin_appel}
              onChange={(e) => setCallForm({ ...callForm, medecin_appel: e.target.value })}
            />
            <p className="form-hint" style={{ marginTop: 8 }}>
              Le nom et la salle seront annoncés sur l'écran public et à voix haute.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={() => confirmCall('appele')}>
                📢 Annoncer (écran)
              </button>
              <button type="button" className="btn btn-outline" onClick={() => confirmCall('consultation')}>
                ▶ En consultation
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setCallModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {enCours.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3 className="queue-section-title">▶ En consultation</h3>
          <div className="queue-cards">
            {enCours.map((r) => (
              <div key={r.id} className={`queue-card en-cours queue-card-priority-${r.priorite || 'normale'}`}>
                <div className="queue-card-num">{r.numero}</div>
                <div className="queue-card-info">
                  <strong>{r.prenom} {r.nom}</strong>
                  <div className="queue-card-meta">
                    <span>{r.salle || r.service}</span>
                    {r.medecin_appel && <span>{r.medecin_appel}</span>}
                    <span>{r.paye ? '✅ Payé' : '⏳ Non payé'}</span>
                  </div>
                </div>
                <div className="queue-card-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => done(r.id)}>Terminer</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="queue-section-title">⏳ En attente ({enAttente.length})</h3>
        {enAttente.length === 0 ? (
          <div className="card rdv-empty">Aucun patient en attente</div>
        ) : (
          <div className="queue-cards">
            {enAttente.map((r) => (
              <div key={r.id} className={`queue-card queue-card-priority-${r.priorite || 'normale'}`}>
                <div className="queue-card-num">
                  #{r.position}
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>{r.numero}</div>
                </div>
                <div className="queue-card-info">
                  <strong>{r.prenom} {r.nom}</strong>
                  <div className="queue-card-meta">
                    <span className={`badge ${PRIORITE_CLASS[r.priorite || 'normale']}`}>{PRIORITE_FR[r.priorite || 'normale']}</span>
                    <span>~{r.temps_estime_min} min</span>
                    <span>{r.paye ? '✅ Payé' : '⏳'}</span>
                    <span>{r.service}</span>
                    {r.statut_appel === 'appele' && <span className="badge badge-en_cours">Appelé</span>}
                  </div>
                </div>
                <div className="queue-card-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openCallModal(r)}>Appeler</button>
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '6px 8px', fontSize: 12 }}
                    value={r.priorite || 'normale'}
                    onChange={(e) => setPriority(r.id, e.target.value)}
                  >
                    {Object.entries(PRIORITE_FR).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
