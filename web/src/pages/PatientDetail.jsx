import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { canConsult } from '../utils/permissions';
import PageHeader from '../components/PageHeader';
import { Badge } from './DataTable';
import { STATUT_FR, formatDate, formatDateTime, formatAge, formatFcfa } from '../utils/labels';
import { generateDossierPDF } from '../utils/pdfDossier';
import '../components/PaymentModal.css';
import './PatientDetail.css';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const showConsult = canConsult(user?.role);

  useEffect(() => {
    Promise.all([
      api.getPatient(id),
      api.getPatientTimeline(id).catch(() => ({ data: [] })),
    ])
      .then(([r, t]) => {
        setData(r.data);
        setTimeline(t.data || []);
      })
      .catch(() => navigate('/app/patients'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleExport = async () => {
    setExporting(true);
    try {
      generateDossierPDF(data);
    } catch {
      /* ignore */
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data?.patient) return null;

  const p = data.patient;
  const age = formatAge(p.date_naissance);

  return (
    <div className="patient-detail">
      <PageHeader
        title=""
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Génération…' : '📄 Exporter en PDF'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/app/patients')}>
              ← Retour à la liste
            </button>
          </div>
        }
      />

      <div className="patient-hero card">
        <div className="patient-avatar">{p.prenom?.[0]}{p.nom?.[0]}</div>
        <div className="patient-hero-info">
          <h1>{p.prenom} {p.nom}</h1>
          <p className="patient-meta">
            {age && <span>{age}</span>}
            {p.sexe && <span>{p.sexe === 'M' ? 'Homme' : p.sexe === 'F' ? 'Femme' : p.sexe}</span>}
            {p.groupe_sanguin && <span>Groupe {p.groupe_sanguin}</span>}
          </p>
          <p className="patient-contact">📞 {p.telephone || '—'} · ✉️ {p.email}</p>
          {p.adresse && <p className="patient-address">📍 {p.adresse}</p>}
        </div>
        <div className="patient-hero-actions">
          {p.allergies && (
            <div className="allergy-alert">⚠️ Allergie : {p.allergies}</div>
          )}
          <div className="qr-chip">QR : {p.qr_code}</div>
          {showConsult && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/app/consultation/${id}`)}
            >
              🩺 Ouvrir une consultation
            </button>
          )}
        </div>
      </div>

      <div className="patient-grid">
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>📊 Timeline médicale unifiée</h2>
          {timeline.length === 0 ? (
            <p className="section-empty">Aucun événement</p>
          ) : (
            <div className="unified-timeline">
              {timeline.map((ev) => (
                <div key={`${ev.type}-${ev.id}`} className="timeline-event" data-icon={ev.icon}>
                  <div className="timeline-date">{formatDateTime(ev.date)}</div>
                  <strong>{ev.titre}</strong>
                  {ev.medecin && <span className="timeline-doctor">{ev.medecin}</span>}
                  {ev.details && <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>{ev.details}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>📋 Historique des consultations</h2>
          {(data.historique || []).length === 0 ? (
            <p className="section-empty">Aucune consultation enregistrée</p>
          ) : (
            data.historique.map((h) => (
              <div key={h.id} className="timeline-item">
                <div className="timeline-date">{formatDateTime(h.date_consultation)}</div>
                <div className="timeline-body">
                  <strong>{h.diagnostic}</strong>
                  {h.medecin_prenom && (
                    <span className="timeline-doctor">Dr. {h.medecin_prenom} {h.medecin_nom}</span>
                  )}
                  {h.notes && <p>{h.notes}</p>}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="card">
          <h2>🧪 Analyses médicales</h2>
          {(data.analyses || []).length === 0 ? (
            <p className="section-empty">Aucune analyse</p>
          ) : (
            <ul className="simple-list">
              {data.analyses.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.type_analyse}</strong>
                    <small>{formatDate(a.date_demande)}</small>
                  </div>
                  <Badge status={a.statut} label={STATUT_FR[a.statut]} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>💊 Ordonnances</h2>
          {(data.ordonnances || []).length === 0 ? (
            <p className="section-empty">Aucune ordonnance</p>
          ) : (
            data.ordonnances.map((o) => (
              <div key={o.id} className="ordo-block">
                <div className="ordo-head">
                  <span>{formatDate(o.date_creation)}</span>
                  <Badge status={o.statut} label={STATUT_FR[o.statut]} />
                </div>
                <p className="ordo-doctor">Dr. {o.medecin_prenom} {o.medecin_nom}</p>
                <ul>
                  {(o.medicaments || []).map((m, i) => (
                    <li key={i}>{m.nom} — {m.dosage || ''} ({m.duree || ''})</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="card">
          <h2>🎫 Tickets récents</h2>
          {(data.tickets || []).length === 0 ? (
            <p className="section-empty">Aucun ticket</p>
          ) : (
            <ul className="simple-list">
              {data.tickets.map((t) => (
                <li key={t.id}>
                  <div>
                    <strong>{t.numero}</strong>
                    <small>{t.service} — {formatFcfa(t.prix)}</small>
                  </div>
                  <Badge status={t.statut} label={STATUT_FR[t.statut]} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
