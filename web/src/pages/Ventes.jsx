import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatFcfa, formatDateTime } from '../utils/labels';

export default function Ventes() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicaments, setMedicaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ medicament_id: '', quantite: 1, patient_nom: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getVentes()
      .then((r) => setRows(r.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.getMedicaments().then((r) => setMedicaments(r.data || [])).catch(() => {});
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createVente({
        medicament_id: parseInt(formData.medicament_id, 10),
        quantite: parseInt(formData.quantite, 10) || 1,
        patient_nom: formData.patient_nom || null,
      });
      toast('Vente enregistrée');
      setShowForm(false);
      setFormData({ medicament_id: '', quantite: 1, patient_nom: '' });
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedMed = medicaments.find((m) => m.id === parseInt(formData.medicament_id, 10));
  const total = selectedMed ? selectedMed.prix * (parseInt(formData.quantite, 10) || 1) : 0;

  return (
    <div>
      <PageHeader
        title="Ventes & caisse"
        subtitle="Historique des ventes à la pharmacie (FCFA)"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Nouvelle vente
          </button>
        }
      />

      {showForm && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={handleCreate}>
          <h3 style={{ marginBottom: 16 }}>Nouvelle vente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Médicament *</label>
              <select className="input" value={formData.medicament_id} onChange={(e) => setFormData({ ...formData, medicament_id: e.target.value })} required>
                <option value="">— Sélectionner —</option>
                {medicaments.filter((m) => m.stock > 0).map((m) => (
                  <option key={m.id} value={m.id}>{m.nom} (Stock: {m.stock} · {formatFcfa(m.prix)})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Quantité *</label>
              <input className="input" type="number" min="1" value={formData.quantite} onChange={(e) => setFormData({ ...formData, quantite: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Patient (optionnel)</label>
              <input className="input" value={formData.patient_nom} onChange={(e) => setFormData({ ...formData, patient_nom: e.target.value })} placeholder="Nom du patient" />
            </div>
          </div>
          {total > 0 && (
            <p style={{ marginTop: 12, fontSize: 16, fontWeight: 700 }}>Total : {formatFcfa(total)}</p>
          )}
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Valider la vente'}
          </button>
        </form>
      )}

      <div className="card">
        {loading ? (
          <p className="empty">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="empty">Aucune vente</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Médicament</th>
                <th>Quantité</th>
                <th>Total</th>
                <th>Vendu par</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.medicament_nom}</strong></td>
                  <td>{r.quantite}</td>
                  <td><strong>{formatFcfa(r.prix_total)}</strong></td>
                  <td>{r.pharmacien_nom || '—'}</td>
                  <td>{formatDateTime(r.date_vente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
