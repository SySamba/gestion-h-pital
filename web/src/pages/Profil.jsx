import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { Badge } from './DataTable';
import { STATUT_FR, formatDateTime, formatDate, formatAge, formatFcfa } from '../utils/labels';
import { generateDossierPDF } from '../utils/pdfDossier';
import './PatientDetail.css';

export default function Profil() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api.getMyProfile()
      .then((r) => {
        setData(r.data);
        const p = r.data.patient;
        setEditForm({
          telephone: p.telephone || '',
          date_naissance: p.date_naissance ? new Date(p.date_naissance).toISOString().slice(0, 10) : '',
          sexe: p.sexe || '',
          adresse: p.adresse || '',
          groupe_sanguin: p.groupe_sanguin || '',
          allergies: p.allergies || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExportPDF = () => {
    setExporting(true);
    try {
      generateDossierPDF(data);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMyProfile(editForm);
      toast('Profil mis à jour');
      setEditing(false);
      const r = await api.getMyProfile();
      setData(r.data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data?.patient) return null;

  const p = data.patient;

  return (
    <div className="patient-detail">
      <PageHeader
        title="Mon dossier médical"
        subtitle="Vos informations de santé en un seul endroit"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(!editing)}>
              {editing ? 'Annuler' : '✏️ Modifier'}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? 'Génération…' : '📄 Télécharger en PDF'}
            </button>
          </div>
        }
      />

      <div className="patient-hero card">
        <div className="patient-avatar">{p.prenom?.[0]}{p.nom?.[0]}</div>
        <div className="patient-hero-info">
          <h1>{p.prenom} {p.nom}</h1>
          <p className="patient-meta">
            {formatAge(p.date_naissance) && <span>{formatAge(p.date_naissance)}</span>}
            {p.groupe_sanguin && <span>Groupe {p.groupe_sanguin}</span>}
          </p>
          <p className="patient-contact">📞 {p.telephone} · ✉️ {p.email}</p>
          {p.adresse && <p className="patient-address">📍 {p.adresse}</p>}
        </div>
        <div className="patient-hero-actions">
          {p.allergies && <div className="allergy-alert">⚠️ Allergie : {p.allergies}</div>}
          <div className="qr-chip">Mon QR : {p.qr_code}</div>
        </div>
      </div>

      {editing && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSaveProfile}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Modifier mes informations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Téléphone</label>
              <input className="input" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} placeholder="+221 ..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date de naissance</label>
              <input className="input" type="date" value={editForm.date_naissance} onChange={(e) => setEditForm({ ...editForm, date_naissance: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Sexe</label>
              <select className="input" value={editForm.sexe} onChange={(e) => setEditForm({ ...editForm, sexe: e.target.value })}>
                <option value="">—</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Groupe sanguin</label>
              <select className="input" value={editForm.groupe_sanguin} onChange={(e) => setEditForm({ ...editForm, groupe_sanguin: e.target.value })}>
                <option value="">—</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Adresse</label>
              <input className="input" value={editForm.adresse} onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })} placeholder="Dakar, Sénégal" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Allergies</label>
              <input className="input" value={editForm.allergies} onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })} placeholder="Pénicilline, arachides..." />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? 'Enregistrement...' : '✓ Enregistrer'}
          </button>
        </form>
      )}

      <div className="patient-grid">
        <section className="card">
          <h2 style={{ marginBottom: 20, fontSize: 16 }}>📋 Mes consultations</h2>
          {(data.historique || []).length === 0 ? (
            <p className="section-empty">Aucune consultation enregistrée</p>
          ) : (
            data.historique.map((h) => (
              <div key={h.id} className="timeline-item">
                <div className="timeline-date">{formatDateTime(h.date_consultation)}</div>
                <div className="timeline-body">
                  <strong>{h.diagnostic}</strong>
                  {h.medecin_prenom && <span className="timeline-doctor">Dr. {h.medecin_prenom} {h.medecin_nom}</span>}
                  {h.notes && <p>{h.notes}</p>}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="card">
          <h2 style={{ marginBottom: 20, fontSize: 16 }}>🧪 Mes analyses</h2>
          {(data.analyses || []).length === 0 ? (
            <p className="section-empty">Aucune analyse</p>
          ) : (
            <ul className="simple-list">
              {(data.analyses || []).map((a) => (
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
          <h2 style={{ marginBottom: 20, fontSize: 16 }}>💊 Mes ordonnances</h2>
          {(data.ordonnances || []).length === 0 ? (
            <p className="section-empty">Aucune ordonnance</p>
          ) : (
            (data.ordonnances || []).map((o) => (
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
          <h2 style={{ marginBottom: 20, fontSize: 16 }}>🎫 Mes tickets</h2>
          {(data.tickets || []).length === 0 ? (
            <p className="section-empty">Aucun ticket</p>
          ) : (
            <ul className="simple-list">
              {(data.tickets || []).map((t) => (
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
