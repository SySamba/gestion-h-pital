import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatDateTime } from '../utils/labels';

const TYPE_LABELS = {
  assurance_sante: 'Assurance santé',
  mutuelle: 'Mutuelle',
  ipm: 'IPM',
  cnss: 'CNSS',
  autre: 'Autre',
};

const STATUT_LABELS = {
  actif: 'Actif',
  expire: 'Expiré',
  suspendu: 'Suspendu',
};

const EMPTY_ASSURANCE = { nom: '', type: 'assurance_sante', telephone: '', email: '', adresse: '', taux_couverture: 80, plafond_annuel: '' };
const EMPTY_ATTACH = { patient_id: '', assurance_id: '', numero_adherent: '', taux_couverture: '', date_debut: '', date_fin: '' };

export default function Assurances() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('assurances');
  const [assurances, setAssurances] = useState([]);
  const [patientAssurances, setPatientAssurances] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ASSURANCE);
  const [attachForm, setAttachForm] = useState(EMPTY_ATTACH);

  const canManage = user?.role === 'admin';
  const canAttach = user?.role === 'admin' || user?.role === 'receptionniste' || user?.role === 'caissier';

  const load = useCallback(async () => {
    try {
      const [a, pa, pats] = await Promise.all([
        api.getAssurances(),
        api.getPatientAssurances(),
        canAttach ? api.getPatients() : Promise.resolve({ data: [] }),
      ]);
      setAssurances(a.data || []);
      setPatientAssurances(pa.data || []);
      setPatients(pats.data || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [canAttach, toast]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateAssurance(editing.id, form);
        toast('Assurance mise à jour');
      } else {
        await api.createAssurance(form);
        toast('Assurance créée');
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_ASSURANCE);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleEdit = (a) => {
    setEditing(a);
    setForm({ nom: a.nom, type: a.type, telephone: a.telephone || '', email: a.email || '', adresse: a.adresse || '', taux_couverture: a.taux_couverture, plafond_annuel: a.plafond_annuel || '' });
    setShowForm(true);
  };

  const handleDelete = async (a) => {
    if (!confirm(`Supprimer "${a.nom}" ?`)) return;
    try {
      await api.deleteAssurance(a.id);
      toast('Assurance supprimée');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleAttach = async (e) => {
    e.preventDefault();
    try {
      await api.attachPatientAssurance(attachForm);
      toast('Assurance rattachée au patient');
      setShowAttach(false);
      setAttachForm(EMPTY_ATTACH);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDetach = async (pa) => {
    if (!confirm('Retirer cette assurance du patient ?')) return;
    try {
      await api.detachPatientAssurance(pa.id);
      toast('Rattachement supprimé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Assurances & tiers payant"
        subtitle="Gestion des organismes d'assurance et rattachements patients"
        action={canManage && (
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_ASSURANCE); setShowForm(true); }}>
            + Nouvelle assurance
          </button>
        )}
      />

      <div className="admin-tabs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button type="button" className={`btn ${tab === 'assurances' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('assurances')}>🏢 Organismes</button>
        <button type="button" className={`btn ${tab === 'patients' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('patients')}>👥 Rattachements patients</button>
      </div>

      {loading ? (
        <div className="card">Chargement...</div>
      ) : tab === 'assurances' ? (
        <div className="card">
          {assurances.length === 0 ? (
            <p className="empty">Aucun organisme d'assurance enregistré</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Taux couverture</th>
                  <th>Plafond annuel</th>
                  <th>Statut</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {assurances.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.nom}</strong></td>
                    <td>{TYPE_LABELS[a.type] || a.type}</td>
                    <td>{a.telephone || '—'}</td>
                    <td>{a.email || '—'}</td>
                    <td><strong>{a.taux_couverture}%</strong></td>
                    <td>{a.plafond_annuel ? Number(a.plafond_annuel).toLocaleString('fr-FR') + ' FCFA' : '—'}</td>
                    <td><span className={`badge ${a.actif ? 'badge-termine' : 'badge-annule'}`}>{a.actif ? 'Actif' : 'Inactif'}</span></td>
                    {canManage && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => handleEdit(a)}>✏️</button>
                          <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(a)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          {canAttach && (
            <button type="button" className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowAttach(true)}>
              + Rattacher un patient
            </button>
          )}
          <div className="card">
            {patientAssurances.length === 0 ? (
              <p className="empty">Aucun rattachement patient enregistré</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Assurance</th>
                    <th>N° adhérent</th>
                    <th>Taux</th>
                    <th>Période</th>
                    <th>Statut</th>
                    {canAttach && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {patientAssurances.map((pa) => (
                    <tr key={pa.id}>
                      <td><strong>{pa.patient_prenom} {pa.patient_nom}</strong></td>
                      <td>{pa.assurance_nom}</td>
                      <td>{pa.numero_adherent}</td>
                      <td>{pa.taux_couverture ? `${pa.taux_couverture}%` : `${pa.assurance_taux}%`}</td>
                      <td>
                        {pa.date_debut ? new Date(pa.date_debut).toLocaleDateString('fr-FR') : '—'}
                        {pa.date_fin ? ` → ${new Date(pa.date_fin).toLocaleDateString('fr-FR')}` : ''}
                      </td>
                      <td><span className={`badge ${pa.statut === 'actif' ? 'badge-termine' : 'badge-annule'}`}>{STATUT_LABELS[pa.statut]}</span></td>
                      {canAttach && (
                        <td>
                          <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDetach(pa)}>🗑️</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal: Créer / Modifier assurance */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>{editing ? 'Modifier assurance' : 'Nouvelle assurance'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nom *</label>
                  <input className="input" value={form.nom} onChange={(e) => set('nom', e.target.value)} required placeholder="Allianz Sénégal" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Type</label>
                  <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Taux couverture (%)</label>
                  <input className="input" type="number" min="0" max="100" step="any" value={form.taux_couverture} onChange={(e) => set('taux_couverture', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Téléphone</label>
                  <input className="input" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+221 ..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Plafond annuel (FCFA)</label>
                  <input className="input" type="number" min="0" value={form.plafond_annuel} onChange={(e) => set('plafond_annuel', e.target.value)} placeholder="500000" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Adresse</label>
                  <input className="input" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Mettre à jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rattacher patient */}
      {showAttach && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAttach(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Rattacher un patient à une assurance</h2>
            <form onSubmit={handleAttach}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Patient *</label>
                  <select className="input" value={attachForm.patient_id} onChange={(e) => setAttachForm((f) => ({ ...f, patient_id: e.target.value }))} required>
                    <option value="">— Sélectionner —</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Assurance *</label>
                  <select className="input" value={attachForm.assurance_id} onChange={(e) => setAttachForm((f) => ({ ...f, assurance_id: e.target.value }))} required>
                    <option value="">— Sélectionner —</option>
                    {assurances.filter((a) => a.actif).map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>N° adhérent *</label>
                  <input className="input" value={attachForm.numero_adherent} onChange={(e) => setAttachForm((f) => ({ ...f, numero_adherent: e.target.value }))} required placeholder="ADH-2024-001" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Taux spécifique (%)</label>
                  <input className="input" type="number" min="0" max="100" step="any" value={attachForm.taux_couverture} onChange={(e) => setAttachForm((f) => ({ ...f, taux_couverture: e.target.value }))} placeholder="Par défaut de l'assurance" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date début</label>
                  <input className="input" type="date" value={attachForm.date_debut} onChange={(e) => setAttachForm((f) => ({ ...f, date_debut: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date fin</label>
                  <input className="input" type="date" value={attachForm.date_fin} onChange={(e) => setAttachForm((f) => ({ ...f, date_fin: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAttach(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Rattacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
