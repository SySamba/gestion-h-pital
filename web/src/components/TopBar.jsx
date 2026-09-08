import React, { useEffect, useState, useRef, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../api/api';

import { useAuth } from '../context/AuthContext';

import './TopBar.css';



export default function TopBar({ onMenuClick }) {

  const { user } = useAuth();

  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [search, setSearch] = useState('');

  const [results, setResults] = useState([]);

  const [showNotif, setShowNotif] = useState(false);

  const notifRef = useRef(null);



  const loadNotifications = useCallback(() => {

    api.getNotifications().then((r) => setNotifications(r.data)).catch(() => {});

  }, []);



  useEffect(() => { loadNotifications(); }, [loadNotifications]);



  useEffect(() => {

    if (!showNotif) return undefined;



    const onKey = (e) => { if (e.key === 'Escape') setShowNotif(false); };

    const onClick = (e) => {

      if (notifRef.current && !notifRef.current.contains(e.target)) {

        setShowNotif(false);

      }

    };



    document.addEventListener('keydown', onKey);

    document.addEventListener('mousedown', onClick);

    return () => {

      document.removeEventListener('keydown', onKey);

      document.removeEventListener('mousedown', onClick);

    };

  }, [showNotif]);



  const unread = notifications.filter((n) => !n.lu).length;

  const canSearchPatients = ['admin', 'receptionniste', 'medecin'].includes(user?.role);



  const handleSearch = async (q) => {

    setSearch(q);

    if (q.length < 2) { setResults([]); return; }

    try {

      const r = await api.search(q);

      setResults(r.data);

    } catch { setResults([]); }

  };



  const markRead = async (id) => {

    try {

      await api.markNotificationRead(id);

      loadNotifications();

    } catch { /* ignore */ }

  };



  const markAllRead = async () => {

    try {

      await api.markAllNotificationsRead();

      loadNotifications();

    } catch { /* ignore */ }

  };



  const today = new Date().toLocaleDateString('fr-SN', {

    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',

  });



  return (

    <header className="topbar">

      <div className="topbar-left">

        <button type="button" className="topbar-hamburger" onClick={onMenuClick} aria-label="Ouvrir le menu">

          <span></span>

          <span></span>

          <span></span>

        </button>

        <span className="topbar-date">{today}</span>

      </div>

      <div className="topbar-center">

        {canSearchPatients && (

          <div className="search-box">

            <span>🔍</span>

            <input

              type="search"

              placeholder="Rechercher un patient, QR code..."

              value={search}

              onChange={(e) => handleSearch(e.target.value)}

            />

            {results.length > 0 && (

              <div className="search-results">

                {results.map((p) => (

                  <button

                    key={p.id}

                    type="button"

                    onClick={() => { navigate(`/app/patients/${p.id}`); setSearch(''); setResults([]); }}

                  >

                    {p.prenom} {p.nom} — {p.telephone || p.email}

                  </button>

                ))}

              </div>

            )}

          </div>

        )}

      </div>

      <div className="topbar-right">

        <div className="notif-wrap" ref={notifRef}>

          <button

            type="button"

            className={`topbar-btn ${showNotif ? 'active' : ''}`}

            onClick={() => setShowNotif((v) => !v)}

            aria-label="Notifications"

            aria-expanded={showNotif}

          >

            🔔

            {unread > 0 && <span className="notif-badge">{unread}</span>}

          </button>



          {showNotif && (

            <>

              <div className="notif-backdrop" onClick={() => setShowNotif(false)} aria-hidden="true" />

              <div className="notif-dropdown card">

                <div className="notif-dropdown-header">

                  <h3>Notifications {unread > 0 && <span className="notif-count">({unread})</span>}</h3>

                  <button type="button" className="notif-close" onClick={() => setShowNotif(false)} aria-label="Fermer">✕</button>

                </div>

                {notifications.length === 0 ? (

                  <p className="empty" style={{ padding: 16 }}>Aucune notification</p>

                ) : (

                  <div className="notif-list">

                    {notifications.slice(0, 8).map((n) => (

                      <div

                        key={n.id}

                        className={`notif-item ${n.lu ? '' : 'unread'}`}

                        onClick={() => !n.lu && markRead(n.id)}

                        role="button"

                        tabIndex={0}

                        onKeyDown={(e) => e.key === 'Enter' && !n.lu && markRead(n.id)}

                      >

                        <strong>{n.titre}</strong>

                        <p>{n.message}</p>

                        <small>{new Date(n.created_at).toLocaleString('fr-SN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>

                      </div>

                    ))}

                  </div>

                )}

                <div className="notif-dropdown-footer">

                  {unread > 0 && (

                    <button type="button" className="btn btn-outline btn-sm" onClick={markAllRead}>

                      Tout marquer lu

                    </button>

                  )}

                  <button

                    type="button"

                    className="btn btn-primary btn-sm"

                    onClick={() => { setShowNotif(false); navigate('/app/notifications'); }}

                  >

                    Voir tout

                  </button>

                </div>

              </div>

            </>

          )}

        </div>

        <div className="user-chip">

          <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>

          <div>

            <strong>{user?.prenom} {user?.nom}</strong>

            <small>{user?.role}</small>

          </div>

        </div>

      </div>

    </header>

  );

}

