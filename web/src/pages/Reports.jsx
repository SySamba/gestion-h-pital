import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';

export default function Reports() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then((r) => setStats(r.data))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const formatFcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

  return (
    <div>
      <PageHeader
        title="Rapports & Statistiques"
        subtitle="Synthèse pour la direction — activité hospitalière"
      />
      {loading && <div className="card">Chargement des statistiques...</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon">💰</div>
          <div className="value">{formatFcfa(stats?.revenus_journaliers)}</div>
          <div className="label">Recettes tickets (jour)</div>
        </div>
        <div className="stat-card">
          <div className="icon">📊</div>
          <div className="value">{formatFcfa(stats?.revenus_semaine)}</div>
          <div className="label">Recettes tickets (7 jours)</div>
        </div>
        <div className="stat-card">
          <div className="icon">🎫</div>
          <div className="value">{stats?.tickets_aujourdhui ?? '—'}</div>
          <div className="label">Tickets émis aujourd'hui</div>
        </div>
        <div className="stat-card">
          <div className="icon">🩺</div>
          <div className="value">{stats?.consultations_mois ?? '—'}</div>
          <div className="label">Consultations (30 jours)</div>
        </div>
        <div className="stat-card">
          <div className="icon">👥</div>
          <div className="value">{stats?.patients ?? '—'}</div>
          <div className="label">Patients enregistrés</div>
        </div>
        <div className="stat-card">
          <div className="icon">📋</div>
          <div className="value">{stats?.file_attente ?? '—'}</div>
          <div className="label">File d'attente active</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: 'none' }}>
        <h3 style={{ marginBottom: 8 }}>MedikaSN — Prêt pour la commercialisation</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Plateforme web complète : multi-rôles, données médicales sécurisées (JWT),
          contexte Sénégal (FCFA, +221). Idéal pour cliniques, hôpitaux et centres de santé.
        </p>
      </div>
    </div>
  );
}
