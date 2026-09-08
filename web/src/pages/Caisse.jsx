import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import PageHeader from '../components/PageHeader';
import { formatFcfa, formatDateTime } from '../utils/labels';

const MODES = [
  { value: 'especes', label: 'Espèces' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'carte_bancaire', label: 'Carte bancaire' },
];

const SERVICES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'analyse', label: 'Analyse de laboratoire' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'autre', label: 'Autre service' },
];

const EMPTY_ENC = { patient_id: '', patient_nom: '', libelle: '', type_service: 'consultation', montant: '', mode_paiement: 'especes', facture_id: '' };

export default function Caisse() {
  const [dash, setDash] = useState(null);
  const [caisse, setCaisse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [showEnc, setShowEnc] = useState(false);
  const [encForm, setEncForm] = useState(EMPTY_ENC);
  const [encSaving, setEncSaving] = useState(false);
  const [encError, setEncError] = useState('');
  const [openCaisseModal, setOpenCaisseModal] = useState(false);
  const [fondsInitial, setFondsInitial] = useState('50000');
  const [closeCaisseModal, setCloseCaisseModal] = useState(false);
  const [soldeReel, setSoldeReel] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [factures, setFactures] = useState([]);
  const [factureFilter, setFactureFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [aRecouvrer, setARecouvrer] = useState(null);
  const [encFromFacture, setEncFromFacture] = useState(null);

  const loadAll = useCallback(() => {
    Promise.all([
      api.getCaisseDashboard().catch(() => null),
      api.getCaisseStatus().catch(() => null),
    ]).then(([d, c]) => {
      if (d) setDash(d.data);
      if (c) setCaisse(c.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => { api.getPatients().then((r) => setPatients(r.data || [])).catch(() => {}); }, []);

  const loadFactures = () => {
    const params = factureFilter !== 'all' ? `?statut=${factureFilter}` : '';
    api.getFactures(params).then((r) => setFactures(r.data || [])).catch(() => {});
  };

  const loadTransactions = () => {
    api.getTransactions().then((r) => setTransactions(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (tab === 'factures') loadFactures();
    if (tab === 'transactions') loadTransactions();
    if (tab === 'recouvrer') loadARecouvrer();
  }, [tab, factureFilter]);

  const loadARecouvrer = () => {
    api.getFacturesARecouvrer().then((r) => setARecouvrer(r.data)).catch(() => {});
  };

  const openEncFromFacture = (f) => {
    setEncFromFacture(f);
    const reste = Number(f.montant_total) - Number(f.montant_paye);
    setEncForm({
      patient_id: f.patient_id || '',
      patient_nom: f.patient_nom || '',
      libelle: `Paiement facture ${f.numero}`,
      type_service: 'consultation',
      montant: String(reste),
      mode_paiement: 'especes',
      facture_id: String(f.id),
    });
    setShowEnc(true);
  };

  const handleOpenCaisse = async () => {
    try {
      await api.openCaisse({ fonds_initial: parseInt(fondsInitial, 10) || 0 });
      setOpenCaisseModal(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleCloseCaisse = async () => {
    try {
      await api.closeCaisse({ solde_reel: parseInt(soldeReel, 10) || null, notes: closeNotes });
      setCloseCaisseModal(false);
      setSoldeReel('');
      setCloseNotes('');
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleEncaisser = async (e) => {
    e.preventDefault();
    setEncSaving(true);
    setEncError('');
    try {
      await api.encaisser({
        ...encForm,
        montant: parseFloat(encForm.montant) || 0,
        patient_id: encForm.patient_id || null,
        facture_id: encForm.facture_id || null,
      });
      setShowEnc(false);
      setEncForm(EMPTY_ENC);
      setEncFromFacture(null);
      loadAll();
      if (tab === 'transactions') loadTransactions();
      if (tab === 'recouvrer') loadARecouvrer();
    } catch (err) {
      setEncError(err.message);
    } finally {
      setEncSaving(false);
    }
  };

  const handleSearch = (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults(null); return; }
    api.searchCaisse(q).then((r) => setSearchResults(r.data)).catch(() => {});
  };

  const handleDownloadFacture = async (id, numero) => {
    try {
      const blob = await api.getFacturePdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert(err.message); }
  };

  const set = (k, v) => setEncForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const caisseOuverte = caisse?.session;
  const today = dash?.today || {};

  return (
    <div>
      <PageHeader
        title="Caisse"
        subtitle="Encaissements, factures et gestion de session"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {caisseOuverte ? (
              <>
                <button type="button" className="btn btn-primary" onClick={() => setShowEnc(true)}>
                  + Encaisser
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setCloseCaisseModal(true)}>
                  Clôturer la caisse
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setOpenCaisseModal(true)}>
                Ouvrir la caisse
              </button>
            )}
          </div>
        }
      />

      {/* ─── Onglets ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'dashboard', label: '📊 Tableau de bord' },
          { key: 'recouvrer', label: '🧾 À recouvrer' },
          { key: 'transactions', label: '💰 Transactions' },
          { key: 'factures', label: '📄 Factures' },
          { key: 'recherche', label: '🔎 Recherche' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: tab === t.key ? 'var(--primary)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Dashboard ─── */}
      {tab === 'dashboard' && (
        <div>
          {!caisseOuverte && (
            <div className="card" style={{ padding: 16, marginBottom: 16, background: '#fffbeb', borderColor: '#fde68a' }}>
              ⚠️ <strong>Aucune caisse ouverte.</strong> Cliquez sur "Ouvrir la caisse" pour commencer à encaisser.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Aujourd'hui</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{formatFcfa(today.total_encaisse || 0)}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Transactions</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{today.nb_transactions || 0}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Espèces</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{formatFcfa(today.total_especes || 0)}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Mobile Money</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{formatFcfa(today.total_mobile || 0)}</div>
            </div>
          </div>

          {caisseOuverte && caisse?.totals && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>📦 Session de caisse en cours</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div><small style={{ color: 'var(--text-muted)' }}>Fonds initial</small><div style={{ fontWeight: 700 }}>{formatFcfa(caisse.session.fonds_initial)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Encaissé</small><div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatFcfa(caisse.totals.total_encaisse)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Remboursé</small><div style={{ fontWeight: 700, color: 'var(--error)' }}>{formatFcfa(caisse.totals.total_rembourse)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Espèces</small><div style={{ fontWeight: 700 }}>{formatFcfa(caisse.totals.especes)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Wave</small><div style={{ fontWeight: 700 }}>{formatFcfa(caisse.totals.wave)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Orange Money</small><div style={{ fontWeight: 700 }}>{formatFcfa(caisse.totals.orange_money)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Free Money</small><div style={{ fontWeight: 700 }}>{formatFcfa(caisse.totals.free_money)}</div></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Carte</small><div style={{ fontWeight: 700 }}>{formatFcfa(caisse.totals.carte_bancaire)}</div></div>
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--text-muted)' }}>Solde théorique</small>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                  {formatFcfa(Number(caisse.session.fonds_initial) + Number(caisse.totals.total_encaisse) - Number(caisse.totals.total_rembourse))}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>🕐 Paiements récents</h2>
            {(dash?.recent || []).length === 0 ? (
              <p className="empty">Aucune transaction aujourd'hui</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Heure</th><th>Patient</th><th>Service</th><th>Mode</th><th style={{ textAlign: 'right' }}>Montant</th></tr>
                </thead>
                <tbody>
                  {dash.recent.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDateTime(t.date_transaction)}</td>
                      <td>{t.patient_nom || '—'}</td>
                      <td>{t.libelle}</td>
                      <td>{t.mode_paiement_label || t.mode_paiement}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatFcfa(t.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── À recouvrer ─── */}
      {tab === 'recouvrer' && (
        <div>
          {aRecouvrer && aRecouvrer.count > 0 && (
            <div className="card" style={{ padding: 20, marginBottom: 16, background: '#fffbeb', borderColor: '#fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 16 }}>🧾 {aRecouvrer.count} facture(s) à recouvrer</strong>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Total à recouvrer : <strong style={{ color: 'var(--error)', fontSize: 16 }}>{formatFcfa(aRecouvrer.total_a_recouvrer)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            {!aRecouvrer || aRecouvrer.count === 0 ? (
              <p className="empty">✅ Aucune facture en attente de paiement</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Facture</th>
                    <th>Patient</th>
                    <th>Services</th>
                    <th>Total</th>
                    <th>Payé</th>
                    <th>Reste</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {aRecouvrer.factures.map((f) => {
                    const reste = Number(f.montant_total) - Number(f.montant_paye);
                    return (
                      <tr key={f.id}>
                        <td><strong>{f.numero}</strong></td>
                        <td>{f.patient_nom || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 250 }}>
                          {f.lignes_resume || '—'}
                        </td>
                        <td>{formatFcfa(f.montant_total)}</td>
                        <td>{formatFcfa(f.montant_paye)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--error)' }}>{formatFcfa(reste)}</td>
                        <td>
                          {f.source === 'auto' ? (
                            <span className="badge badge-en_attente" title="Générée automatiquement par un service">🤖 Auto</span>
                          ) : (
                            <span className="badge badge-termine" title="Créée manuellement">✋ Manuelle</span>
                          )}
                        </td>
                        <td>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => openEncFromFacture(f)}>
                            💰 Encaisser
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Transactions ─── */}
      {tab === 'transactions' && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Historique des transactions</h2>
          {transactions.length === 0 ? (
            <p className="empty">Aucune transaction</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Patient</th><th>Libellé</th><th>Mode</th><th>Type</th><th>Statut</th><th style={{ textAlign: 'right' }}>Montant</th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDateTime(t.date_transaction)}</td>
                    <td>{t.patient_nom || '—'}</td>
                    <td>{t.libelle}</td>
                    <td>{t.mode_paiement_label || t.mode_paiement}</td>
                    <td>{t.type_operation === 'remboursement' ? '🔄 Remboursement' : t.type_operation === 'correction' ? '⚠️ Correction' : '✅ Encaissement'}</td>
                    <td>
                      {t.statut === 'succes' ? <span className="badge badge-termine">Succès</span> :
                       t.statut === 'annule' ? <span className="badge badge-annule">Annulé</span> :
                       <span className="badge badge-en_attente">Échec</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: t.type_operation === 'remboursement' ? 'var(--error)' : 'var(--success)' }}>
                      {t.type_operation === 'remboursement' ? '-' : ''}{formatFcfa(t.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── Factures ─── */}
      {tab === 'factures' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { v: 'all', l: 'Toutes' },
              { v: 'impayee', l: 'Impayées' },
              { v: 'partielle', l: 'Partielles' },
              { v: 'payee', l: 'Payées' },
            ].map((f) => (
              <button key={f.v} type="button" className={`btn btn-sm ${factureFilter === f.v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFactureFilter(f.v)}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="card">
            {factures.length === 0 ? (
              <p className="empty">Aucune facture</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Numéro</th><th>Patient</th><th>Total</th><th>Payé</th><th>Reste</th><th>Statut</th><th>Source</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {factures.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.numero}</strong></td>
                      <td>{f.patient_nom || '—'}</td>
                      <td>{formatFcfa(f.montant_total)}</td>
                      <td>{formatFcfa(f.montant_paye)}</td>
                      <td style={{ fontWeight: 700, color: Number(f.montant_total - f.montant_paye) > 0 ? 'var(--error)' : 'var(--success)' }}>
                        {formatFcfa(f.montant_total - f.montant_paye)}
                      </td>
                      <td>
                        {f.statut === 'payee' ? <span className="badge badge-termine">Payée</span> :
                         f.statut === 'partielle' ? <span className="badge badge-en_attente">Partielle</span> :
                         f.statut === 'annulee' ? <span className="badge badge-annule">Annulée</span> :
                         <span className="badge badge-en_attente">Impayée</span>}
                      </td>
                      <td>
                        {f.source === 'auto' ? (
                          <span className="badge badge-en_attente">🤖 Auto</span>
                        ) : (
                          <span className="badge badge-termine">✋ Manuelle</span>
                        )}
                      </td>
                      <td>{formatDateTime(f.date_creation)}</td>
                      <td>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDownloadFacture(f.id, f.numero)}>
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Recherche ─── */}
      {tab === 'recherche' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <input
              className="input"
              placeholder="🔎 Rechercher patient, facture, transaction…"
              value={searchQ}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ maxWidth: 500 }}
            />
          </div>

          {searchResults && (
            <div style={{ display: 'grid', gap: 16 }}>
              {searchResults.patients?.length > 0 && (
                <div className="card">
                  <h2 style={{ fontSize: 16, marginBottom: 12 }}>Patients</h2>
                  {searchResults.patients.map((p) => (
                    <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <strong>{p.prenom} {p.nom}</strong> — {p.email} · {p.telephone || '—'}
                    </div>
                  ))}
                </div>
              )}
              {searchResults.factures?.length > 0 && (
                <div className="card">
                  <h2 style={{ fontSize: 16, marginBottom: 12 }}>Factures</h2>
                  {searchResults.factures.map((f) => (
                    <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <strong>{f.numero}</strong> — {f.patient_nom} — {formatFcfa(f.montant_total)} ({f.statut})
                    </div>
                  ))}
                </div>
              )}
              {searchResults.transactions?.length > 0 && (
                <div className="card">
                  <h2 style={{ fontSize: 16, marginBottom: 12 }}>Transactions</h2>
                  {searchResults.transactions.map((t) => (
                    <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <strong>{formatFcfa(t.montant)}</strong> — {t.libelle} — {t.patient_nom || '—'} — {formatDateTime(t.date_transaction)}
                    </div>
                  ))}
                </div>
              )}
              {searchResults.patients?.length === 0 && searchResults.factures?.length === 0 && searchResults.transactions?.length === 0 && (
                <div className="card"><p className="empty">Aucun résultat</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal Encaissement ─── */}
      {showEnc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setShowEnc(false); setEncFromFacture(null); }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Encaisser un paiement</h2>
            {encFromFacture && (
              <div style={{ padding: 12, marginBottom: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <strong>Facture {encFromFacture.numero}</strong> — {encFromFacture.patient_nom}<br />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Total : {formatFcfa(encFromFacture.montant_total)} · Payé : {formatFcfa(encFromFacture.montant_paye)} · Reste : <strong style={{ color: 'var(--error)' }}>{formatFcfa(Number(encFromFacture.montant_total) - Number(encFromFacture.montant_paye))}</strong>
                </span>
              </div>
            )}
            <form onSubmit={handleEncaisser}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Patient (optionnel)</label>
                <select className="input" value={encForm.patient_id} onChange={(e) => { const p = patients.find(x => x.id === parseInt(e.target.value)); set('patient_id', e.target.value); set('patient_nom', p ? `${p.prenom} ${p.nom}` : ''); }}>
                  <option value="">— Aucun —</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Service *</label>
                <select className="input" value={encForm.type_service} onChange={(e) => set('type_service', e.target.value)}>
                  {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Libellé *</label>
                <input className="input" value={encForm.libelle} onChange={(e) => set('libelle', e.target.value)} required placeholder="ex: Consultation générale" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Montant (FCFA) *</label>
                  <input className="input" type="number" min="0" step="any" value={encForm.montant} onChange={(e) => set('montant', e.target.value)} required placeholder="5000" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mode de paiement *</label>
                  <select className="input" value={encForm.mode_paiement} onChange={(e) => set('mode_paiement', e.target.value)}>
                    {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              {encError && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{encError}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEnc(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={encSaving}>
                  {encSaving ? 'Enregistrement…' : 'Encaisser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Ouvrir caisse ─── */}
      {openCaisseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setOpenCaisseModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 380, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, fontSize: 18 }}>Ouvrir la caisse</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Fonds initial (FCFA)</label>
              <input className="input" type="number" min="0" value={fondsInitial} onChange={(e) => setFondsInitial(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setOpenCaisseModal(false)}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={handleOpenCaisse}>Ouvrir</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Clôturer caisse ─── */}
      {closeCaisseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setCloseCaisseModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8, fontSize: 18 }}>Clôturer la caisse</h2>
            {caisse?.totals && (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Solde théorique : <strong>{formatFcfa(Number(caisse.session.fonds_initial) + Number(caisse.totals.total_encaisse) - Number(caisse.totals.total_rembourse))}</strong>
              </p>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Solde réel compté (FCFA)</label>
              <input className="input" type="number" min="0" value={soldeReel} onChange={(e) => setSoldeReel(e.target.value)} placeholder="Solde compté en espèces" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes (optionnel)</label>
              <textarea className="input" rows={2} value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Observations…" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setCloseCaisseModal(false)}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={handleCloseCaisse}>Clôturer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
