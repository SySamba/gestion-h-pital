import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import PageHeader from '../components/PageHeader';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  const load = () => api.getNotifications().then((r) => setItems(r.data));

  useEffect(() => { load(); }, []);

  const markRead = (id) => api.markNotificationRead(id).then(load);
  const markAll = () => api.markAllNotificationsRead().then(load);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alertes rendez-vous, analyses, tickets et système"
        action={
          <button type="button" className="btn btn-outline" onClick={markAll}>
            Tout marquer comme lu
          </button>
        }
      />
      <div className="card">
        {items.length === 0 ? (
          <p className="empty">Aucune notification</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className="activity-item"
              style={{
                background: n.lu ? 'transparent' : '#eff6ff',
                margin: '0 -24px',
                padding: '16px 24px',
                borderRadius: 8,
              }}
            >
              <span className={`activity-dot ${n.type}`} />
              <div style={{ flex: 1 }}>
                <strong>{n.titre}</strong>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{n.message}</p>
                <small style={{ color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </small>
              </div>
              {!n.lu && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => markRead(n.id)}>
                  Lu
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
