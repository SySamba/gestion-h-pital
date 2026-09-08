import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ROLE_LABELS } from '../api/api';
import PageHeader from '../components/PageHeader';
import QuickAction from '../components/QuickAction';
import Dashboard from './Dashboard';
import './RoleHome.css';
import './ReceptionPages.css';

const ROLE_CONFIG = {
  patient: {
    subtitle: 'Votre espace santé personnel',
    actions: [
      { icon: '🎫', title: 'Mes tickets', description: 'Acheter un ticket et suivre la file', to: '/app/tickets', color: 'blue' },
      { icon: '📍', title: "Ma file d'attente", description: 'Position en temps réel + bouton secours', to: '/app/ma-file', color: 'orange' },
      { icon: '📅', title: 'Rendez-vous', description: 'Prendre ou voir vos RDV', to: '/app/rendez-vous', color: 'green' },
      { icon: '🧪', title: 'Mes analyses', description: 'Résultats et suivi laboratoire', to: '/app/analyses', color: 'purple' },
      { icon: '💊', title: 'Ordonnances', description: 'Vos prescriptions médicales', to: '/app/ordonnances', color: 'orange' },
      { icon: '📋', title: 'Dossier médical', description: 'Historique et informations santé', to: '/app/profil', color: 'teal' },
    ],
  },
  medecin: {
    subtitle: 'Espace médecin — consultations et suivi',
    showDashboard: true,
    actions: [
      { icon: '👥', title: 'Patients', description: 'Liste, dossiers et consultations', to: '/app/patients', color: 'blue' },
      { icon: '📅', title: 'Rendez-vous', description: 'Planning du jour', to: '/app/rendez-vous', color: 'green' },
      { icon: '🎫', title: "File d'attente", description: 'Patients en attente', to: '/app/file-attente', color: 'orange' },
      { icon: '🧪', title: 'Analyses', description: 'Demandes laboratoire', to: '/app/analyses', color: 'purple' },
      { icon: '️', title: 'Hospitalisation', description: 'Lits et admissions', to: '/app/hospitalisation', color: 'blue' },
    ],
  },
  laborantin: {
    subtitle: 'Laboratoire — analyses et résultats',
    actions: [
      { icon: '🧪', title: 'Analyses en cours', description: 'Traiter et valider les résultats', to: '/app/analyses', color: 'purple' },
    ],
  },
  pharmacien: {
    subtitle: 'Pharmacie — délivrance des ordonnances',
    showDashboard: true,
    actions: [
      { icon: '📋', title: 'Ordonnances', description: 'Délivrer aux patients', to: '/app/ordonnances', color: 'blue' },
      { icon: '💊', title: 'Stock & médicaments', description: 'Gérer produits et inventaire', to: '/app/stock', color: 'orange' },
      { icon: '💰', title: 'Ventes & caisse', description: 'Historique des ventes', to: '/app/ventes', color: 'green' },
      { icon: '📈', title: 'Rapports', description: 'Statistiques activité', to: '/app/rapports', color: 'teal' },
    ],
  },
  caissier: {
    subtitle: 'Caisse — encaissements et facturation',
    actions: [
      { icon: '💰', title: 'Caisse & encaissements', description: 'Ouvrir la caisse, encaisser les paiements', to: '/app/caisse', color: 'green' },
      { icon: '📄', title: 'Factures', description: 'Créer et consulter les factures', to: '/app/caisse', color: 'blue' },
      { icon: '📈', title: 'Rapports', description: 'Statistiques de caisse', to: '/app/rapports', color: 'teal' },
    ],
  },
  receptionniste: {
    subtitle: 'Accueil — patients et organisation',
    receptionHome: true,
  },
  admin: {
    subtitle: 'Supervision complète — tous les modules',
    showDashboard: true,
    actions: [
      { icon: '👥', title: 'Patients', description: 'Dossiers, consultation médicale', to: '/app/patients', color: 'blue' },
      { icon: '👤', title: 'Nouveau patient', description: 'Enregistrement accueil', to: '/app/patients-nouveau', color: 'green' },
      { icon: '🎫', title: 'Tickets & file', description: "Tickets et file d'attente", to: '/app/file-attente', color: 'orange' },
      { icon: '📅', title: 'Rendez-vous', description: 'Planning global', to: '/app/rendez-vous', color: 'purple' },
      { icon: '🧪', title: 'Laboratoire', description: 'Analyses et résultats', to: '/app/analyses', color: 'purple' },
      { icon: '⚙️', title: 'Administration', description: 'Paramètres, salles, personnel', to: '/app/administration', color: 'red' },
      { icon: '👤', title: 'Utilisateurs', description: 'Gestion des comptes', to: '/app/utilisateurs', color: 'orange' },
      { icon: '🛏️', title: 'Hospitalisation', description: 'Lits et admissions', to: '/app/hospitalisation', color: 'blue' },
      { icon: '🛡️', title: 'Assurances', description: 'Tiers payant', to: '/app/assurances', color: 'green' },
    ],
  },
};

function ReceptionHome({ user }) {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(() => null),
      api.getQueueLive().catch(() => null),
    ]).then(([s, q]) => {
      if (s) setStats(s.data);
      if (q) setQueue(q.data?.file || []);
    });
  }, []);

  const waiting = queue.filter((t) => t.statut === 'en_attente');
  const current = queue.find((t) => t.statut === 'en_cours');

  return (
    <div className="reception-home">
      <PageHeader
        title={`Bonjour, ${user?.prenom} 👋`}
        subtitle={`${ROLE_LABELS.receptionniste} — Accueil patients`}
      />

      <div className="reception-stats">
        <div className="card reception-stat highlight">
          <div className="stat-value">{stats?.file_attente ?? '—'}</div>
          <div className="stat-label">File d'attente</div>
        </div>
        <div className="card reception-stat">
          <div className="stat-value">{stats?.rendez_vous_aujourdhui ?? '—'}</div>
          <div className="stat-label">RDV aujourd'hui</div>
        </div>
        <div className="card reception-stat">
          <div className="stat-value">{stats?.tickets_aujourdhui ?? '—'}</div>
          <div className="stat-label">Tickets émis</div>
        </div>
      </div>

      <Link to="/app/nouvelle-consultation" className="card reception-cta">
        <div className="reception-cta-icon">🩺</div>
        <h2>Nouvelle consultation</h2>
        <p>Rechercher un patient, créer un ticket — workflow rapide en un écran</p>
      </Link>

      <div className="reception-links">
        <Link to="/app/file-attente" className="reception-link">
          <span className="reception-link-icon">📋</span>
          <div><strong>File d'attente</strong><span>Gérer l'ordre de passage</span></div>
        </Link>
        <Link to="/app/rendez-vous" className="reception-link">
          <span className="reception-link-icon">📅</span>
          <div><strong>RDV du jour</strong><span>Planning et rappels SMS</span></div>
        </Link>
        <Link to="/app/patients-nouveau" className="reception-link">
          <span className="reception-link-icon">👤</span>
          <div><strong>Nouveau patient</strong><span>Formulaire complet + connexion</span></div>
        </Link>
        <Link to="/app/patients" className="reception-link">
          <span className="reception-link-icon">👥</span>
          <div><strong>Liste patients</strong><span>Rechercher un dossier</span></div>
        </Link>
      </div>

      {(current || waiting.length > 0) && (
        <div className="reception-queue-preview card">
          <h3>📋 Aperçu file d'attente</h3>
          {current && (
            <div className="reception-queue-item en-cours">
              <span className="ticket-num">▶ {current.numero}</span>
              <span>{current.prenom} {current.nom} — en consultation</span>
            </div>
          )}
          {waiting.slice(0, 4).map((t) => (
            <div key={t.id} className="reception-queue-item">
              <span className="ticket-num">{t.numero}</span>
              <span>{t.prenom} {t.nom} · ~{t.temps_estime_min} min</span>
            </div>
          ))}
          {waiting.length > 4 && (
            <Link to="/app/file-attente" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
              Voir tout ({waiting.length} en attente)
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoleHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.patient;

  useEffect(() => {
    if (config.showDashboard || user?.role === 'admin') {
      api.getDashboard().then((r) => setStats(r.data)).catch(() => {});
    } else if (user?.role === 'patient') {
      Promise.all([
        api.getTickets().catch(() => ({ data: [] })),
        api.getRdv().catch(() => ({ data: [] })),
      ]).then(([t, r]) => {
        setStats({ tickets: t.data?.length || 0, rdv: r.data?.length || 0 });
      });
    }
  }, [user?.role, config.showDashboard]);

  if (config.receptionHome) {
    return <ReceptionHome user={user} />;
  }

  if (config.showDashboard && user?.role !== 'patient') {
    return (
      <div className="role-home">
        <PageHeader
          title={`Bonjour, ${user?.prenom} 👋`}
          subtitle={`${ROLE_LABELS[user?.role]} — ${config.subtitle}`}
        />
        <div className="role-home-dashboard">
          <Dashboard embedded />
        </div>
        <h2 className="role-home-section-title">Accès rapide</h2>
        <div className="quick-actions-grid">
          {config.actions.map((a) => (
            <QuickAction key={a.title} {...a} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="role-home">
      <div className="role-home-hero card">
        <div className="role-home-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
        <div>
          <h1>Bonjour, {user?.prenom} 👋</h1>
          <p>{ROLE_LABELS[user?.role]} — {config.subtitle}</p>
        </div>
      </div>

      {user?.role === 'patient' && stats && (
        <div className="role-mini-stats">
          <div className="stat-card"><div className="value">{stats.tickets}</div><div className="label">Tickets</div></div>
          <div className="stat-card"><div className="value">{stats.rdv}</div><div className="label">Rendez-vous</div></div>
        </div>
      )}

      <h2 className="role-home-section-title">Que souhaitez-vous faire ?</h2>
      <div className="quick-actions-grid">
        {config.actions.map((a) => (
          <QuickAction key={a.title} {...a} />
        ))}
      </div>
    </div>
  );
}
