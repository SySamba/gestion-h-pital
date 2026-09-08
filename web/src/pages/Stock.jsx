import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/api';
import PageHeader from '../components/PageHeader';
import { formatFcfa } from '../utils/labels';

const EMPTY_FORM = { nom: '', description: '', stock: 0, prix: 0, seuil_alerte: 10 };

export default function Stock() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [stockMode, setStockMode] = useState('set');
  const [importMsg, setImportMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.getMedicaments()
      .then((r) => setMeds(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = meds.filter((m) =>
    m.nom.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = meds.filter((m) => m.stock <= m.seuil_alerte).length;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (med) => {
    setEditing(med);
    setForm({ nom: med.nom, description: med.description || '', stock: med.stock, prix: med.prix, seuil_alerte: med.seuil_alerte });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.updateMedicament(editing.id, form);
      } else {
        await api.createMedicament(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (med) => {
    if (!confirm(`Supprimer "${med.nom}" ?`)) return;
    try {
      await api.deleteMedicament(med.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const openStock = (med) => {
    setStockModal(med);
    setStockValue(String(med.stock));
    setStockMode('set');
  };

  const handleStockSave = async () => {
    if (!stockModal) return;
    const body = stockMode === 'set'
      ? { new_stock: parseInt(stockValue, 10) || 0 }
      : { adjustment: parseInt(stockValue, 10) || 0 };
    try {
      await api.adjustStock(stockModal.id, body);
      setStockModal(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    try {
      const res = await api.importMedicaments(file);
      setImportMsg(res.message);
      load();
    } catch (err) {
      setImportMsg(`Erreur: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadMedicamentTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele_medicaments.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Stock pharmacie"
        subtitle="Gérer les médicaments, le stock et les alertes de rupture"
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={handleDownloadTemplate}>
              📥 Modèle Excel
            </button>
            <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? 'Import…' : '📊 Importer Excel'}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              + Ajouter un médicament
            </button>
          </div>
        }
      />

      {importMsg && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <strong>{importMsg}</strong>
        </div>
      )}

      {lowStock > 0 && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, background: '#fef2f2', borderColor: '#fecaca' }}>
          ⚠️ <strong>{lowStock}</strong> médicament(s) en stock bas — pensez à réapprovisionner.
        </div>
      )}

      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <input
          className="input"
          placeholder="🔍 Rechercher un médicament…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

      <div className="card">
        {loading ? (
          <p className="empty">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">Aucun médicament trouvé</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Médicament</th>
                <th>Description</th>
                <th>Stock</th>
                <th>Prix unitaire</th>
                <th>Seuil alerte</th>
                <th>État</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.nom}</strong></td>
                  <td>{m.description || '—'}</td>
                  <td>
                    <strong style={{ color: m.stock <= m.seuil_alerte ? 'var(--error)' : 'var(--success)' }}>
                      {m.stock}
                    </strong>
                  </td>
                  <td>{formatFcfa(m.prix)}</td>
                  <td>{m.seuil_alerte}</td>
                  <td>
                    {m.stock <= m.seuil_alerte ? (
                      <span className="badge badge-en_attente">Stock bas</span>
                    ) : m.stock === 0 ? (
                      <span className="badge badge-annule">Rupture</span>
                    ) : (
                      <span className="badge badge-termine">OK</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openStock(m)}>
                        📦 Stock
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>
                        ✏️ Modifier
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(m)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Modal Ajouter / Modifier ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>
              {editing ? 'Modifier le médicament' : 'Ajouter un médicament'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nom *</label>
                <input className="input" value={form.nom} onChange={(e) => set('nom', e.target.value)} required placeholder="Paracétamol 500mg" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
                <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Antalgique" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Stock initial</label>
                  <input className="input" type="number" min="0" value={form.stock} onChange={(e) => set('stock', parseInt(e.target.value, 10) || 0)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Prix (FCFA)</label>
                  <input className="input" type="number" min="0" step="any" value={form.prix} onChange={(e) => set('prix', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Seuil d'alerte</label>
                <input className="input" type="number" min="0" value={form.seuil_alerte} onChange={(e) => set('seuil_alerte', parseInt(e.target.value, 10) || 0)} />
              </div>
              {error && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Ajustement stock ─── */}
      {stockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setStockModal(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8, fontSize: 18 }}>Ajuster le stock</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              <strong>{stockModal.nom}</strong> — Stock actuel : {stockModal.stock} unités
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button type="button" className={`btn btn-sm ${stockMode === 'set' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStockMode('set')}>
                Valeur absolue
              </button>
              <button type="button" className={`btn btn-sm ${stockMode === 'adjust' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStockMode('adjust')}>
                Ajout / Retrait
              </button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {stockMode === 'set' ? 'Nouveau stock' : 'Quantité à ajouter (ou négatif pour retirer)'}
              </label>
              <input
                className="input"
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                placeholder={stockMode === 'set' ? 'ex: 200' : 'ex: +50 ou -20'}
              />
              {stockMode === 'adjust' && stockValue && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Nouveau stock : <strong>{Math.max(0, stockModal.stock + (parseInt(stockValue, 10) || 0))}</strong>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStockModal(null)}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={handleStockSave}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
