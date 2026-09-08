import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ROLE_LABELS } from '../api/api';
import { BRAND } from '../constants/branding';
import TopBar from './TopBar';
import './Layout.css';

/** Menus complets par rôle — Admin a TOUT */
const menus = {
  patient: [
    { section: 'Mon espace' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/tickets', label: 'Tickets', icon: '🎫' },
    { to: '/app/ma-file', label: "Ma file d'attente", icon: '📍' },
    { to: '/app/rendez-vous', label: 'Rendez-vous', icon: '📅' },
    { to: '/app/analyses', label: 'Analyses', icon: '🧪' },
    { to: '/app/ordonnances', label: 'Ordonnances', icon: '💊' },
    { to: '/app/certificats', label: 'Certificats', icon: '📄' },
    { to: '/app/profil', label: 'Dossier médical', icon: '📋' },
  ],
  medecin: [
    { section: 'Médecin' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/patients', label: 'Patients', icon: '👥' },
    { to: '/app/hospitalisation', label: 'Hospitalisation & lits', icon: '🛏️' },
    { to: '/app/rendez-vous', label: 'Rendez-vous', icon: '📅' },
    { to: '/app/file-attente', label: "File d'attente", icon: '🎫' },
    { to: '/app/urgence', label: 'Alertes urgence', icon: '🚨' },
    { to: '/app/analyses', label: 'Analyses', icon: '🧪' },
  ],
  laborantin: [
    { section: 'Laboratoire' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/analyses', label: 'Analyses', icon: '🧪' },
  ],
  pharmacien: [
    { section: 'Pharmacie' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/ordonnances', label: 'Ordonnances', icon: '📋' },
    { to: '/app/stock', label: 'Stock & médicaments', icon: '💊' },
    { to: '/app/ventes', label: 'Ventes & caisse', icon: '💰' },
    { to: '/app/rapports', label: 'Rapports', icon: '📈' },
    { to: '/app/assurances', label: 'Assurances', icon: '🛡️' },
  ],
  caissier: [
    { section: 'Caisse' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/caisse', label: 'Caisse & encaissements', icon: '💰' },
    { to: '/app/assurances', label: 'Assurances', icon: '🛡️' },
    { to: '/app/rapports', label: 'Rapports', icon: '📈' },
  ],
  receptionniste: [
    { section: 'Accueil' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/nouvelle-consultation', label: 'Nouvelle consultation', icon: '🩺' },
    { to: '/app/file-attente', label: "File d'attente", icon: '📋' },
    { to: '/app/urgence', label: 'Alertes urgence', icon: '🚨' },
    { to: '/app/rendez-vous', label: 'Rendez-vous', icon: '📅' },
    { to: '/app/patients-nouveau', label: 'Nouveau patient', icon: '👤' },
    { to: '/app/patients', label: 'Patients', icon: '👥' },
  ],
  admin: [
    { section: 'Direction' },
    { to: '/app', label: 'Accueil', icon: '🏠' },
    { to: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/app/administration', label: 'Administration', icon: '⚙️' },
    { to: '/app/rapports', label: 'Rapports', icon: '📈' },
    { to: '/app/etablissements', label: 'Établissements', icon: '🏢' },
    { to: '/app/utilisateurs', label: 'Utilisateurs', icon: '⚙️' },
    { section: 'Patients & soins' },
    { to: '/app/patients', label: 'Patients', icon: '👥' },
    { to: '/app/patients-nouveau', label: 'Nouveau patient', icon: '👤' },
    { to: '/app/rendez-vous', label: 'Rendez-vous', icon: '📅' },
    { to: '/app/file-attente', label: "File d'attente", icon: '🎫' },
    { to: '/app/urgence', label: 'Alertes urgence', icon: '🚨' },
    { to: '/app/tickets', label: 'Tickets', icon: '🎫' },
    { section: 'Laboratoire & pharmacie' },
    { to: '/app/analyses', label: 'Analyses', icon: '🧪' },
    { to: '/app/ordonnances', label: 'Ordonnances', icon: '📋' },
    { to: '/app/stock', label: 'Stock pharmacie', icon: '💊' },
    { to: '/app/ventes', label: 'Ventes', icon: '💰' },
    { to: '/app/caisse', label: 'Caisse', icon: '💵' },
    { section: 'Documents & assurances' },
    { to: '/app/hospitalisation', label: 'Hospitalisation & lits', icon: '🛏️' },
    { to: '/app/assurances', label: 'Assurances', icon: '🛡️' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = menus[user?.role] || menus.patient;

  useEffect(() => {
    api.getSettings().then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const brandName = settings?.nom || BRAND.name;

  return (
    <div className="layout">
      {/* Overlay mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">🏥</div>
          <div>
            <strong>{brandName}</strong>
            <small>{settings?.slogan || BRAND.tagline}</small>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >✕</button>
        </div>
        <nav className="sidebar-nav">
          {items.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="version">v3.0 — {ROLE_LABELS[user?.role]}</div>
          <button type="button" className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
            Déconnexion
          </button>
        </div>
      </aside>
      <div className="main-wrap">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
