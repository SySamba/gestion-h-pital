import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { canConsult, canManagePatients, isAdmin } from '../utils/permissions';
import PageHeader from '../components/PageHeader';
import { formatAge } from '../utils/labels';
import './Patients.css';

export default function Patients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const showConsult = canConsult(user?.role);
  const showRegister = canManagePatients(user?.role) || isAdmin(user?.role);

  useEffect(() => {
    api.getPatients()
      .then((r) => setPatients(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.telephone?.includes(q) ||
      p.qr_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} patient(s) enregistré(s) — recherche par nom, email ou QR`}
        action={
          showRegister && (
            <button type="button" className="btn btn-primary" onClick={() => navigate('/app/patients-nouveau')}>
              + Nouveau patient
            </button>
          )
        }
      />

      <div className="patients-toolbar card">
        <input
          type="search"
          className="input search-input"
          placeholder="🔍 Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><p className="empty">Aucun patient trouvé</p></div>
      ) : (
        <div className="patients-grid">
          {filtered.map((p) => (
            <article key={p.id} className="patient-card card">
              <div className="patient-card-top">
                <div className="patient-card-avatar">{p.prenom?.[0]}{p.nom?.[0]}</div>
                <div>
                  <h3>{p.prenom} {p.nom}</h3>
                  {formatAge(p.date_naissance) && <span className="patient-card-age">{formatAge(p.date_naissance)}</span>}
                </div>
              </div>
              <div className="patient-card-info">
                <p>📞 {p.telephone || '—'}</p>
                <p>✉️ {p.email}</p>
                {p.allergies && <p className="allergy-tag">⚠️ {p.allergies}</p>}
              </div>
              <div className="patient-card-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(`/app/patients/${p.id}`)}
                >
                  📋 Voir le dossier
                </button>
                {showConsult && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate(`/app/consultation/${p.id}`)}
                  >
                    🩺 Consulter
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
