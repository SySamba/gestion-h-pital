import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { generateCertificatPDF } from '../utils/pdfCertificat';
import { formatDateTime } from '../utils/labels';

const TYPE_LABELS = {
  arret_travail: 'Arrêt de travail',
  aptitude: 'Aptitude',
  consultation: 'Consultation',
  hospitalisation: 'Hospitalisation',
  deces: 'Décès',
  autre: 'Autre',
};

const TYPE_ICONS = {
  arret_travail: '🛏️',
  aptitude: '✅',
  consultation: '🩺',
  hospitalisation: '🏥',
  deces: '⚰️',
  autre: '📄',
};

const EMPTY_FORM = {
  patient_id: '',
  type: 'arret_travail',
  date_examen: new Date().toISOString().slice(0, 10),
  date_debut: '',
  date_fin: '',
  nombre_jours: '',
  contenu: '',
  conclusion: '',
  lieu: 'Dakar, Sénégal',
};

export default function Certificats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificats, setCertificats] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canCreate = user?.role === 'medecin' || user?.role === 'admin';
  const canDelete = canCreate;

  const load = useCallback(async () => {
    try {
      const [certs, pats] = await Promise.all([
        api.getCertificats(),
        canCreate ? api.getPatients() : Promise.resolve({ data: [] }),
      ]);
      setCertificats(certs.data || []);
      setPatients(pats.data || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [canCreate, toast]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.contenu) {
      toast('Patient et contenu obligatoires', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.createCertificat(form);
      toast('Certificat créé');
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePDF = async (cert) => {
    try {
      const r = await api.getCertificat(cert.id);
      generateCertificatPDF(r.data);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (cert) => {
    if (!window.confirm(`Supprimer le certificat ${cert.numero} ? Cette action est irréversible.`)) return;
    try {
      await api.deleteCertificat(cert.id);
      toast('Certificat supprimé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Certificats médicaux"
        subtitle="Générer et gérer les certificats (arrêt de travail, aptitude, etc.)"
        action={canCreate && (
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nouveau certificat
          </button>
        )}
      />

      {loading ? (
        <div className="card">Chargement...</div>
      ) : certificats.length === 0 ? (
        <div className="card rdv-empty">Aucun certificat émis pour le moment</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Type</th>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Date examen</th>
                <th>Émis le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificats.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.numero}</strong></td>
                  <td>
                    <span className="badge badge-en_cours">
                      {TYPE_ICONS[c.type]} {TYPE_LABELS[c.type]}
                    </span>
                  </td>
                  <td>{c.patient_prenom} {c.patient_nom}</td>
                  <td>{c.medecin_prenom ? `Dr. ${c.medecin_prenom} ${c.medecin_nom}` : '—'}</td>
                  <td>{new Date(c.date_examen).toLocaleDateString('fr-FR')}</td>
                  <td>{formatDateTime(c.date_emission)}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handlePDF(c)}>
                      PDF
                    </button>
                    {canDelete && (
                      <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(c)}>
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 640, padding: 28, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Nouveau certificat médical</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Patient *</label>
                  <select className="input" value={form.patient_id} onChange={(e) => set('patient_id', e.target.value)} required>
                    <option value="">— Sélectionner —</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Type de certificat *</label>
                  <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date d'examen *</label>
                  <input className="input" type="date" value={form.date_examen} onChange={(e) => set('date_examen', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Lieu</label>
                  <input className="input" value={form.lieu} onChange={(e) => set('lieu', e.target.value)} placeholder="Dakar, Sénégal" />
                </div>
              </div>

              {form.type === 'arret_travail' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14, padding: 12, background: '#fefce8', borderRadius: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nombre de jours</label>
                    <input className="input" type="number" min="1" value={form.nombre_jours} onChange={(e) => set('nombre_jours', e.target.value)} placeholder="3" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date début</label>
                    <input className="input" type="date" value={form.date_debut} onChange={(e) => set('date_debut', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date fin</label>
                    <input className="input" type="date" value={form.date_fin} onChange={(e) => set('date_fin', e.target.value)} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contenu du certificat *</label>
                <textarea
                  className="input"
                  rows={5}
                  value={form.contenu}
                  onChange={(e) => set('contenu', e.target.value)}
                  required
                  placeholder="Décrivez les constatations médicales, l'état du patient, les recommandations..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Conclusion (optionnel)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.conclusion}
                  onChange={(e) => set('conclusion', e.target.value)}
                  placeholder="Conclusion et recommandations..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Génération...' : 'Générer le certificat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
