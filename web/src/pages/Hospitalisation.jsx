import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatDateTime, formatFcfa } from '../utils/labels';

const LIT_STATUT_LABELS = {
  libre: 'Libre',
  occupe: 'Occupé',
  maintenance: 'Maintenance',
  reserve: 'Réservé',
};

const LIT_STATUT_BADGE = {
  libre: 'badge-termine',
  occupe: 'badge-en_cours',
  maintenance: 'badge-annule',
  reserve: 'badge-en_attente',
};

const LIT_TYPES = {
  standard: 'Standard',
  reanimation: 'Réanimation',
  soins_intensifs: 'Soins intensifs',
  maternite: 'Maternité',
};

const HOSP_STATUT_LABELS = {
  en_cours: 'En cours',
  sortie: 'Sortie',
  transfert: 'Transfert',
  deces: 'Décès',
};

export default function Hospitalisation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('lits');
  const [lits, setLits] = useState([]);
  const [hospitalisations, setHospitalisations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [showLit, setShowLit] = useState(false);
  const [showSortie, setShowSortie] = useState(null);
  const [patients, setPatients] = useState([]);
  const [salles, setSalles] = useState([]);
  const [hospFilter, setHospFilter] = useState('all');

  const [litForm, setLitForm] = useState({ salle_id: '', numero: '', type: 'standard', notes: '' });
  const [admitForm, setAdmitForm] = useState({ patient_id: '', lit_id: '', motif_admission: '', diagnostic_admission: '', cout_journalier: 10000 });
  const [sortieForm, setSortieForm] = useState({ motif_sortie: 'Guérison', notes_sortie: '' });

  const canManage = user?.role === 'admin' || user?.role === 'medecin';
  const canAdmit = user?.role === 'admin' || user?.role === 'medecin' || user?.role === 'receptionniste';
  const canDeleteLit = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [l, h, s, pats, sal] = await Promise.all([
        api.getLits(),
        api.getHospitalisations(),
        api.getHospitalisationStats(),
        canAdmit ? api.getPatients() : Promise.resolve({ data: [] }),
        api.getSalles(),
      ]);
      setLits(l.data || []);
      setHospitalisations(h.data || []);
      setStats(s.data);
      setPatients(pats.data || []);
      setSalles(sal.data || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [canAdmit, toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreateLit = async (e) => {
    e.preventDefault();
    try {
      await api.createLit(litForm);
      toast('Lit créé');
      setShowLit(false);
      setLitForm({ salle_id: '', numero: '', type: 'standard', notes: '' });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    try {
      await api.admettreHospitalisation(admitForm);
      toast('Patient admis');
      setShowAdmit(false);
      setAdmitForm({ patient_id: '', lit_id: '', motif_admission: '', diagnostic_admission: '', cout_journalier: 10000 });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSortie = async (e) => {
    e.preventDefault();
    try {
      await api.sortirHospitalisation(showSortie.id, sortieForm);
      toast('Sortie enregistrée');
      setShowSortie(null);
      setSortieForm({ motif_sortie: 'Guérison', notes_sortie: '' });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleLitStatus = async (id, statut) => {
    try {
      await api.updateLit(id, { statut });
      toast('Statut du lit mis à jour');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteLit = async (lit) => {
    if (!confirm(`Supprimer le lit ${lit.numero} ?`)) return;
    try {
      await api.deleteLit(lit.id);
      toast('Lit supprimé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const freeLits = lits.filter((l) => l.statut === 'libre');
  const filteredHosp = hospFilter === 'all' ? hospitalisations : hospitalisations.filter((h) => h.statut === hospFilter);

  return (
    <div>
      <PageHeader
        title="Hospitalisation & lits"
        subtitle="Gestion des lits, admissions et sorties des patients"
        action={canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowLit(true)}>
            + Ajouter un lit
          </button>
        )}
      />

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="icon">🛏️</div>
            <div className="value">{stats.total_lits || 0}</div>
            <div className="label">Total lits</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
            <div className="icon">✅</div>
            <div className="value" style={{ color: 'var(--success)' }}>{stats.libre || 0}</div>
            <div className="label">Lits libres</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--warning)' }}>
            <div className="icon">🏥</div>
            <div className="value" style={{ color: 'var(--warning)' }}>{stats.occupe || 0}</div>
            <div className="label">Lits occupés</div>
          </div>
          <div className="stat-card">
            <div className="icon">📋</div>
            <div className="value">{stats.en_cours || 0}</div>
            <div className="label">Hospitalisations en cours</div>
          </div>
          <div className="stat-card">
            <div className="icon">📥</div>
            <div className="value">{stats.admissions_today || 0}</div>
            <div className="label">Admissions aujourd'hui</div>
          </div>
          <div className="stat-card">
            <div className="icon">📤</div>
            <div className="value">{stats.sorties_today || 0}</div>
            <div className="label">Sorties aujourd'hui</div>
          </div>
        </div>
      )}

      <div className="admin-tabs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button type="button" className={`btn ${tab === 'lits' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('lits')}>🛏️ Lits</button>
        <button type="button" className={`btn ${tab === 'hosp' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('hosp')}>🏥 Hospitalisations</button>
      </div>

      {loading ? (
        <div className="card">Chargement...</div>
      ) : tab === 'lits' ? (
        <div className="card">
          {lits.length === 0 ? (
            <p className="empty">Aucun lit enregistré. Ajoutez des lits à vos salles.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Salle</th>
                  <th>Lit</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Notes</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {lits.map((l) => (
                  <tr key={l.id}>
                    <td>{l.salle_nom}</td>
                    <td><strong>{l.numero}</strong></td>
                    <td>{LIT_TYPES[l.type] || l.type}</td>
                    <td><span className={`badge ${LIT_STATUT_BADGE[l.statut]}`}>{LIT_STATUT_LABELS[l.statut]}</span></td>
                    <td>{l.notes || '—'}</td>
                    {canManage && (
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {l.statut === 'libre' && (
                            <>
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => handleLitStatus(l.id, 'maintenance')}>🔧 Maintenance</button>
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => handleLitStatus(l.id, 'reserve')}>📌 Réserver</button>
                            </>
                          )}
                          {(l.statut === 'maintenance' || l.statut === 'reserve') && (
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => handleLitStatus(l.id, 'libre')}>✅ Libérer</button>
                          )}
                          {canDeleteLit && (
                            <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteLit(l)}>🗑️</button>
                          )}
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
          {canAdmit && (
            <button type="button" className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowAdmit(true)}>
              + Admettre un patient
            </button>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'en_cours', 'sortie', 'transfert', 'deces'].map((f) => (
              <button key={f} type="button" className={`btn btn-sm ${hospFilter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHospFilter(f)}>
                {f === 'all' ? 'Toutes' : HOSP_STATUT_LABELS[f] || f}
              </button>
            ))}
          </div>
          <div className="card">
            {filteredHosp.length === 0 ? (
              <p className="empty">Aucune hospitalisation {hospFilter !== 'all' ? `avec le statut « ${HOSP_STATUT_LABELS[hospFilter] || hospFilter} »` : ''}</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Lit</th>
                    <th>Salle</th>
                    <th>Motif</th>
                    <th>Médecin</th>
                    <th>Coût/jour</th>
                    <th>Total</th>
                    <th>Admission</th>
                    <th>Statut</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredHosp.map((h) => {
                    const daysHosp = Math.max(1, Math.ceil((new Date(h.date_sortie || new Date()) - new Date(h.date_admission)) / (1000 * 60 * 60 * 24)));
                    const totalCost = daysHosp * Number(h.cout_journalier || 0);
                    return (
                    <tr key={h.id}>
                      <td><strong>{h.patient_prenom} {h.patient_nom}</strong></td>
                      <td>{h.lit_numero}</td>
                      <td>{h.salle_nom}</td>
                      <td>{h.motif_admission}</td>
                      <td>{h.medecin_prenom ? `Dr. ${h.medecin_prenom} ${h.medecin_nom}` : '—'}</td>
                      <td>{formatFcfa(h.cout_journalier)}</td>
                      <td><strong>{formatFcfa(totalCost)}</strong><br/><small style={{ color: 'var(--text-muted)' }}>{daysHosp} jour(s)</small></td>
                      <td>{formatDateTime(h.date_admission)}</td>
                      <td><span className={`badge ${h.statut === 'en_cours' ? 'badge-en_cours' : 'badge-termine'}`}>{HOSP_STATUT_LABELS[h.statut]}</span></td>
                      {canManage && (
                        <td>
                          {h.statut === 'en_cours' && (
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setShowSortie(h); setSortieForm({ motif_sortie: 'Guérison', notes_sortie: '' }); }}>
                              🚪 Sortie
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );})}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal: Ajouter un lit */}
      {showLit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowLit(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Ajouter un lit</h2>
            <form onSubmit={handleCreateLit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Salle *</label>
                <select className="input" value={litForm.salle_id} onChange={(e) => setLitForm((f) => ({ ...f, salle_id: e.target.value }))} required>
                  <option value="">— Sélectionner —</option>
                  {salles.filter((s) => s.actif).map((s) => (
                    <option key={s.id} value={s.id}>{s.nom} ({s.type})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Numéro *</label>
                  <input className="input" value={litForm.numero} onChange={(e) => setLitForm((f) => ({ ...f, numero: e.target.value }))} required placeholder="A-01" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Type</label>
                  <select className="input" value={litForm.type} onChange={(e) => setLitForm((f) => ({ ...f, type: e.target.value }))}>
                    {Object.entries(LIT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes</label>
                <input className="input" value={litForm.notes} onChange={(e) => setLitForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Proche du bureau infirmier..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowLit(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admettre un patient */}
      {showAdmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAdmit(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Admettre un patient</h2>
            <form onSubmit={handleAdmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Patient *</label>
                  <select className="input" value={admitForm.patient_id} onChange={(e) => setAdmitForm((f) => ({ ...f, patient_id: e.target.value }))} required>
                    <option value="">— Sélectionner —</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Lit disponible *</label>
                  <select className="input" value={admitForm.lit_id} onChange={(e) => setAdmitForm((f) => ({ ...f, lit_id: e.target.value }))} required>
                    <option value="">— Sélectionner —</option>
                    {freeLits.map((l) => <option key={l.id} value={l.id}>{l.salle_nom} - Lit {l.numero}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Motif d'admission *</label>
                <input className="input" value={admitForm.motif_admission} onChange={(e) => setAdmitForm((f) => ({ ...f, motif_admission: e.target.value }))} required placeholder="Chirurgie, surveillance, etc." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Diagnostic</label>
                  <input className="input" value={admitForm.diagnostic_admission} onChange={(e) => setAdmitForm((f) => ({ ...f, diagnostic_admission: e.target.value }))} placeholder="Diagnostic initial" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Coût journalier (FCFA)</label>
                  <input className="input" type="number" min="0" value={admitForm.cout_journalier} onChange={(e) => setAdmitForm((f) => ({ ...f, cout_journalier: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdmit(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Admettre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sortie */}
      {showSortie && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSortie(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8, fontSize: 18 }}>Sortie du patient</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              {showSortie.patient_prenom} {showSortie.patient_nom} — Lit {showSortie.lit_numero} ({showSortie.salle_nom})
            </p>
            <form onSubmit={handleSortie}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Motif de sortie</label>
                <select className="input" value={sortieForm.motif_sortie} onChange={(e) => setSortieForm((f) => ({ ...f, motif_sortie: e.target.value }))}>
                  <option value="Guérison">Guérison</option>
                  <option value="Transfert">Transfert vers autre établissement</option>
                  <option value="Sortie contre avis médical">Sortie contre avis médical</option>
                  <option value="Décès">Décès</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes de sortie</label>
                <textarea className="input" rows={3} value={sortieForm.notes_sortie} onChange={(e) => setSortieForm((f) => ({ ...f, notes_sortie: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSortie(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Confirmer la sortie</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
