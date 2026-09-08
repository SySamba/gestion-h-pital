import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/LandingIcons';
import { AuthAside } from '../components/AuthAside';
import './Login.css';

const DEMO = [
  { email: 'admin@hopital.sn', label: 'Admin', icon: 'shieldCheck' },
  { email: 'dr.ndiaye@hopital.sn', label: 'Médecin', icon: 'stethoscope' },
  { email: 'fatou.fall@hopital.sn', label: 'Patient', icon: 'user' },
  { email: 'reception@hopital.sn', label: 'Réception', icon: 'bell' },
  { email: 'labo@hopital.sn', label: 'Labo', icon: 'fileText' },
  { email: 'pharma@hopital.sn', label: 'Pharmacie', icon: 'wallet' },
  { email: 'caisse@hopital.sn', label: 'Caisse', icon: 'wallet' },
];

const ASIDE_PROPS = {
  title: 'Votre établissement, entièrement digitalisé',
  subtitle:
    'Patients, consultations, laboratoire, pharmacie et direction — réunis dans une plateforme moderne et sécurisée, conçue pour le Sénégal.',
  features: [
    { icon: 'monitor', text: 'Application web accessible depuis tous vos postes' },
    { icon: 'users', text: '7 rôles métier : du patient à l\u2019administrateur' },
    { icon: 'lock', text: 'Données médicales chiffrées et protégées' },
    { icon: 'wallet', text: 'Tarifs, reçus et rapports en FCFA' },
  ],
  footer: [
    { icon: 'mapPin', text: 'Dakar, Sénégal' },
    { icon: 'headset', text: 'Support en français' },
  ],
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@hopital.sn');
  const [password, setPassword] = useState('password123');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <AuthAside {...ASIDE_PROPS} />

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-head">
            <h2>Connexion</h2>
            <p>Accédez à votre espace professionnel</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email professionnel</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon">
                  <Icon name="mail" size={18} />
                </span>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@etablissement.sn"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-pwd">Mot de passe</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon">
                  <Icon name="lock" size={18} />
                </span>
                <input
                  id="login-pwd"
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPwd ? 'lock' : 'shieldCheck'} size={18} />
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <Icon name="bell" size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Connexion en cours…' : 'Se connecter'}
              {!loading && <Icon name="arrowRight" size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/register">Créer un compte patient</Link>
          </p>

          <div className="auth-demo">
            <p className="auth-demo-label">Comptes de démonstration</p>
            <div className="auth-demo-chips">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  className={`auth-demo-chip ${email === d.email ? 'active' : ''}`}
                  onClick={() => setEmail(d.email)}
                >
                  <Icon name={d.icon} size={15} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <Link to="/" className="auth-back">
            <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
