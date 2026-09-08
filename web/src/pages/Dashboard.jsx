import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { Badge } from './DataTable';
import { STATUT_FR } from '../utils/labels';

const STAT_ICONS = {
  patients: '👥',
  rendez_vous_aujourdhui: '📅',
  analyses_en_attente: '🧪',
  file_attente: '🎫',
  revenus_journaliers: '💰',
  tickets_aujourdhui: '📋',
  utilisateurs_actifs: '👤',
  consultations_mois: '🩺',
};

export default function Dashboard({ embedded = false }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(() => null),
      api.getOverview().catch(() => null),
    ]).then(([s, o]) => {
      if (s) setStats(s.data);
      if (o) setOverview(o.data);
    });
  }, []);

  const formatFcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

  const statCards = stats ? [
    { key: 'patients', label: 'Patients enregistrés', value: stats.patients },
    { key: 'rendez_vous_aujourdhui', label: "RDV aujourd'hui", value: stats.rendez_vous_aujourdhui },
    { key: 'file_attente', label: 'File d\'attente', value: stats.file_attente, highlight: stats.file_attente > 0 },
    { key: 'analyses_en_attente', label: 'Analyses en attente', value: stats.analyses_en_attente },
    { key: 'revenus_journaliers', label: 'Revenus du jour', value: formatFcfa(stats.revenus_journaliers), isMoney: true },
    { key: 'consultations_mois', label: 'Consultations (30j)', value: stats.consultations_mois },
    { key: 'tickets_aujourdhui', label: 'Tickets émis', value: stats.tickets_aujourdhui },
    { key: 'utilisateurs_actifs', label: 'Personnel actif', value: stats.utilisateurs_actifs },
  ] : [];

  const maxBar = Math.max(...(overview?.rdv_semaine?.map((d) => d.total) || [1]), 1);

  return (
    <div>
      {!embedded && (
        <PageHeader
          title={`Bonjour, ${user?.prenom} 👋`}
          subtitle="Vue d'ensemble de votre établissement — MedikaSN"
        />
      )}

      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.key} className="stat-card" style={s.alert ? { borderColor: 'var(--warning)' } : {}}>
            <div className="icon">{STAT_ICONS[s.key] || '📊'}</div>
            <div className="value" style={s.alert ? { color: 'var(--warning)' } : {}}>{s.value}</div>
            <div className="label">{s.label}</div>
            {s.key === 'revenus_journaliers' && stats?.revenus_semaine > 0 && (
              <div className="trend">Semaine : {formatFcfa(stats.revenus_semaine)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>📅 Rendez-vous du jour</h2>
            <Link to="/app/rendez-vous" className="btn btn-outline btn-sm">Voir tout</Link>
          </div>
          {(overview?.rendez_vous || []).length === 0 ? (
            <p className="empty">Aucun rendez-vous aujourd'hui</p>
          ) : (
            overview.rendez_vous.map((r) => (
              <div key={r.id} className="queue-item">
                <div>
                  <strong>{r.patient_prenom} {r.patient_nom}</strong>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Dr. {r.medecin_prenom} {r.medecin_nom} — {new Date(r.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Badge status={r.statut} label={STATUT_FR[r.statut]} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🎫 File d'attente</h2>
            <Link to="/app/file-attente" className="btn btn-outline btn-sm">Gérer</Link>
          </div>
          {(overview?.file_attente || []).length === 0 ? (
            <p className="empty">File d'attente vide</p>
          ) : (
            overview.file_attente.map((t, i) => (
              <div key={t.id} className="queue-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="queue-num">{i + 1}</span>
                  <div>
                    <strong>{t.prenom} {t.nom}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.numero} — {t.service}</div>
                  </div>
                </div>
                <Badge status={t.statut} label={STATUT_FR[t.statut]} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>📈 Activité RDV (7 jours)</h2>
          </div>
          <div className="chart-bars">
            {(overview?.rdv_semaine || []).length === 0 ? (
              <p className="empty" style={{ width: '100%' }}>Pas encore de données</p>
            ) : (
              overview.rdv_semaine.map((d, i) => (
                <div key={i} className="chart-bar-wrap">
                  <div className="chart-bar" style={{ height: `${(d.total / maxBar) * 80}px` }} />
                  <span>{d.jour?.slice(0, 3) || '—'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🔔 Activité récente</h2>
          </div>
          {(overview?.activite_recente || []).map((a, i) => (
            <div key={i} className="activity-item">
              <span className={`activity-dot ${a.type}`} />
              <div>
                <strong style={{ textTransform: 'capitalize' }}>{a.type}</strong>
                <div style={{ fontSize: 13 }}>{a.label}</div>
                <small style={{ color: 'var(--text-muted)' }}>
                  {new Date(a.date_event).toLocaleString('fr-FR')}
                </small>
              </div>
              {a.statut && <Badge status={a.statut} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
