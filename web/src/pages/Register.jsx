import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/LandingIcons';
import { AuthAside } from '../components/AuthAside';
import './Login.css';

const ASIDE_PROPS = {
  title: 'Votre santé, toujours à portée de main',
  subtitle:
    'Créez votre compte patient pour prendre rendez-vous, acheter des tickets, consulter vos résultats et suivre votre dossier médical — en toute sécurité.',
  features: [
    { icon: 'calendar', text: 'Prise de rendez-vous en ligne 24h/24' },
    { icon: 'fileText', text: 'Ordonnances, résultats d\u2019analyses et tickets accessibles partout' },
    { icon: 'shieldCheck', text: 'Dossier médical numérique sécurisé et confidentiel' },
    { icon: 'monitor', text: 'Accessible depuis un navigateur, sans rien installer' },
  ],
  footer: [
    { icon: 'mapPin', text: 'Dakar, Sénégal' },
    { icon: 'headset', text: 'Support en français' },
  ],
};

function pwdStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 0, label: 'Trop court' };
  if (score === 2) return { level: 1, label: 'Faible' };
  if (score === 3) return { level: 2, label: 'Correct' };
  return { level: 3, label: 'Fort' };
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const strength = useMemo(() => pwdStrength(form.password), [form.password]);
  const bars = [0, 1, 2];
  const barClass =
    strength.level === 0 ? 'active-weak' :
    strength.level === 1 ? 'active-weak' :
    strength.level === 2 ? 'active-fair' :
    'active-good';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await register({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        password: form.password,
      });
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
            <h2>Créer un compte patient</h2>
            <p>Inscription gratuite — accès immédiat après validation</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="reg-prenom">Prénom</label>
                <div className="auth-input-wrap has-icon">
                  <span className="auth-input-icon">
                    <Icon name="user" size={18} />
                  </span>
                  <input
                    id="reg-prenom"
                    className="input"
                    value={form.prenom}
                    onChange={(e) => set('prenom', e.target.value)}
                    placeholder="Awa"
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="reg-nom">Nom</label>
                <div className="auth-input-wrap has-icon">
                  <span className="auth-input-icon">
                    <Icon name="user" size={18} />
                  </span>
                  <input
                    id="reg-nom"
                    className="input"
                    value={form.nom}
                    onChange={(e) => set('nom', e.target.value)}
                    placeholder="Diop"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Email</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon">
                  <Icon name="mail" size={18} />
                </span>
                <input
                  id="reg-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="vous@exemple.sn"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-tel">Téléphone</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon">
                  <Icon name="phone" size={18} />
                </span>
                <input
                  id="reg-tel"
                  className="input"
                  value={form.telephone}
                  onChange={(e) => set('telephone', e.target.value)}
                  placeholder="+221 77 000 00 00"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-pwd">Mot de passe</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon">
                  <Icon name="lock" size={18} />
                </span>
                <input
                  id="reg-pwd"
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
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
              {form.password.length > 0 && (
                <>
                  <div className="auth-pwd-strength">
                    {bars.map((i) => (
                      <div
                        key={i}
                        className={`auth-pwd-bar ${i < strength.level ? barClass : ''}`}
                      />
                    ))}
                  </div>
                  <p className="auth-pwd-hint">{strength.label}</p>
                </>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-pwd2">Confirmer le mot de passe</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon">
                  <Icon name="shieldCheck" size={18} />
                </span>
                <input
                  id="reg-pwd2"
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <Icon name="bell" size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Création du compte…' : 'Créer mon compte'}
              {!loading && <Icon name="arrowRight" size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>

          <Link to="/" className="auth-back">
            <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
