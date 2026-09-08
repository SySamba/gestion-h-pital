import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatDateTime } from '../utils/labels';
import '../components/PaymentModal.css';

const STATUT_BADGE = {
  active: 'badge-en_attente',
  prise_en_charge: 'badge-en_cours',
  resolue: 'badge-termine',
};

const STATUT_LABEL = {
  active: 'Active',
  prise_en_charge: 'Prise en charge',
  resolue: 'Résolue',
};

export default function UrgenceAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.getUrgenceAlerts()
      .then((r) => setAlerts(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleStatus = async (id, statut) => {
    try {
      await api.updateUrgenceAlert(id, statut);
      toast(statut === 'resolue' ? 'Alerte clôturée' : 'Prise en charge confirmée');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const activeCount = alerts.filter((a) => a.statut === 'active').length;

  return (
    <div>
      <PageHeader
        title="Alertes urgence / Secours"
        subtitle={`Demandes d'assistance patient — ${activeCount} active(s)`}
      />

      {loading ? (
        <div className="card">Chargement...</div>
      ) : alerts.length === 0 ? (
        <div className="card rdv-empty">Aucune alerte urgence en cours</div>
      ) : (
        <div className="urgence-list">
          {alerts.map((a) => (
            <div key={a.id} className={`card urgence-card urgence-${a.statut}`}>
              <div className="urgence-card-header">
                <span className="urgence-icon">🚨</span>
                <div>
                  <strong>{a.prenom} {a.nom}</strong>
                  {a.telephone && <span className="form-hint"> · {a.telephone}</span>}
                </div>
                <span className={`badge ${STATUT_BADGE[a.statut]}`}>{STATUT_LABEL[a.statut]}</span>
              </div>
              <p>{a.message || 'Demande d\'assistance urgente'}</p>
              <p className="form-hint">
                📍 {a.localisation} · {formatDateTime(a.created_at)}
              </p>
              {a.statut !== 'resolue' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {a.statut === 'active' && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleStatus(a.id, 'prise_en_charge')}>
                      Prendre en charge
                    </button>
                  )}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleStatus(a.id, 'resolue')}>
                    Marquer résolue
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
