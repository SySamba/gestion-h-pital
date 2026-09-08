import React from 'react';
import { Icon } from './LandingIcons';

export function AuthAside({ title, subtitle, features, footer }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-pattern" aria-hidden="true" />
      <div className="auth-aside-content">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="auth-brand-info">
            <strong>MedikaSN</strong>
            <span>Plateforme hospitalière</span>
          </div>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="auth-features">
          {features.map((f) => (
            <div key={f.text} className="auth-feature">
              <Icon name={f.icon} size={20} />
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
      {footer && (
        <div className="auth-aside-footer">
          {footer.map((f) => (
            <span key={f.text}>
              <Icon name={f.icon} size={16} />
              {f.text}
            </span>
          ))}
        </div>
      )}
    </aside>
  );
}
