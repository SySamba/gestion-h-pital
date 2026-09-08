import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from './DataTable';
import PageHeader from '../components/PageHeader';
import { STATUT_FR, formatDate } from '../utils/labels';
import { canPharmacy } from '../utils/permissions';

export default function Ordonnances() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPharma = canPharmacy(user?.role);
  const canCreate = user?.role === 'medecin' || user?.role === 'admin';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [medicaments, setMedicaments] = useState([]);
  const [formData, setFormData] = useState({ patient_id: '', medicament_id: '', posologie: '', duree: '' });
  const [prescriptions, setPrescriptions] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getOrdonnances()
      .then((r) => setRows(r.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    if (canCreate) {
      api.getPatients().then((r) => setPatients(r.data || [])).catch(() => {});
      api.getMedicaments().then((r) => setMedicaments(r.data || [])).catch(() => {});
    }
  }, [load, canCreate]);

  const delivrer = async (id) => {
    try {
      await api.deliverOrdonnance(id);
      toast('Ordonnance délivrée au patient');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      const blob = await api.getOrdonnancePdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ordonnance_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const addPrescription = () => {
    if (!formData.medicament_id) { toast('Sélectionnez un médicament', 'error'); return; }
    const med = medicaments.find((m) => m.id === parseInt(formData.medicament_id, 10));
    setPrescriptions([...prescriptions, {
      nom: med?.nom || '',
      dosage: formData.posologie,
      duree: formData.duree,
    }]);
    setFormData({ ...formData, medicament_id: '', posologie: '', duree: '' });
  };

  const removePrescription = (idx) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) { toast('Sélectionnez un patient', 'error'); return; }
    if (prescriptions.length === 0) { toast('Ajoutez au moins un médicament', 'error'); return; }
    setSaving(true);
    try {
      await api.createOrdonnance({
        patient_id: parseInt(formData.patient_id, 10),
        medicaments: prescriptions,
      });
      toast('Ordonnance créée');
      setShowForm(false);
      setPrescriptions([]);
      setFormData({ patient_id: '', medicament_id: '', posologie: '', duree: '' });
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ordonnances"
        subtitle={isPharma ? 'Ordonnances à délivrer à la pharmacie' : 'Vos prescriptions médicales'}
        action={canCreate && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Nouvelle ordonnance
          </button>
        )}
      />

      {showForm && canCreate && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={handleCreate}>
          <h3 style={{ marginBottom: 16 }}>Nouvelle ordonnance</h3>
          <label>Patient *</label>
          <select className="input" value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })} required>
            <option value="">— Sélectionner —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>

          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <strong>Médicaments prescrits</strong>
          </div>
          {prescriptions.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 12 }}>
              {prescriptions.map((p, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span><strong>{p.nom}</strong> — {p.dosage || 'N/A'} ({p.duree || 'N/A'})</span>
                  <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => removePrescription(i)}>✕</button>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 13 }}>Médicament</label>
              <select className="input" value={formData.medicament_id} onChange={(e) => setFormData({ ...formData, medicament_id: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {medicaments.map((m) => (
                  <option key={m.id} value={m.id}>{m.nom} (Stock: {m.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Posologie</label>
              <input className="input" value={formData.posologie} onChange={(e) => setFormData({ ...formData, posologie: e.target.value })} placeholder="1cp x3/jour" />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Durée</label>
              <input className="input" value={formData.duree} onChange={(e) => setFormData({ ...formData, duree: e.target.value })} placeholder="7 jours" />
            </div>
            <button type="button" className="btn btn-outline" onClick={addPrescription}>+ Ajouter</button>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Créer l\'ordonnance'}
          </button>
        </form>
      )}

      <div className="card">
        {loading ? (
          <p className="empty">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="empty">Aucune ordonnance</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Patient</th>
                <th>Prescrit par</th>
                <th>Médicaments</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = typeof r.medicaments === 'string' ? JSON.parse(r.medicaments) : r.medicaments;
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.patient_prenom} {r.patient_nom}</td>
                    <td>Dr. {r.medecin_prenom} {r.medecin_nom}</td>
                    <td>{(m || []).map((x) => x.nom).join(', ') || '—'}</td>
                    <td>{formatDate(r.date_creation)}</td>
                    <td><Badge status={r.statut} label={STATUT_FR[r.statut]} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDownloadPdf(r.id)}>📄 PDF</button>
                        {isPharma && r.statut === 'active' && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => delivrer(r.id)}>Délivrer</button>
                        )}
                        {isPharma && r.statut !== 'active' && <span style={{ color: 'var(--success)' }}>✓</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
