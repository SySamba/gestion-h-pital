import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { PRIORITE_FR } from '../utils/labels';
import './NouvelleConsultation.css';

export default function NouvelleConsultation() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [priorite, setPriorite] = useState('normale');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [newPatient, setNewPatient] = useState({ nom: '', telephone: '', age: '' });
  const [showNewForm, setShowNewForm] = useState(false);

  const doSearch = useCallback(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    api.searchPatients(query.trim())
      .then((r) => {
        setResults(r.data || []);
        setShowNewForm(r.data?.length === 0);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [query]);

  useEffect(() => {
    const t = setTimeout(doSearch, 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const createTicket = async (patientId) => {
    setLoading(true);
    try {
      const res = await api.consultationExpress({ patient_id: patientId, priorite });
      setLastResult(res.data);
      toast(`Ticket ${res.data.ticket.numero} créé`);
      setSelected(null);
      setQuery('');
      setResults([]);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createPatientAndTicket = async (e) => {
    e.preventDefault();
    if (!newPatient.nom.trim() || !newPatient.telephone.trim()) {
      toast('Nom et téléphone requis', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.consultationExpress({
        nom: newPatient.nom.trim(),
        telephone: newPatient.telephone.trim(),
        age: newPatient.age ? parseInt(newPatient.age, 10) : undefined,
        priorite,
      });
      setLastResult(res.data);
      toast(res.data.nouveau_patient
        ? `Patient créé + ticket ${res.data.ticket.numero}`
        : `Ticket ${res.data.ticket.numero} créé`);
      setNewPatient({ nom: '', telephone: '', age: '' });
      setShowNewForm(false);
      setQuery('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nouvelle-consultation">
      <PageHeader
        title="Nouvelle consultation"
        subtitle="Recherchez un patient ou créez-en un — ticket émis en un clic"
      />

      <div className="nc-search-card card">
        <label className="nc-search-label">🔎 Rechercher un patient</label>
        <input
          className="input nc-search-input"
          placeholder="Nom, prénom ou numéro de téléphone..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          autoFocus
        />
        {searching && <p className="nc-hint">Recherche...</p>}
      </div>

      {results.length > 0 && (
        <div className="nc-results card">
          <h3>Patients trouvés ({results.length})</h3>
          <div className="nc-patient-list">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`nc-patient-item ${selected?.id === p.id ? 'selected' : ''}`}
                onClick={() => setSelected(p)}
              >
                <div className="nc-patient-avatar">{p.prenom?.[0]}{p.nom?.[0]}</div>
                <div>
                  <strong>{p.prenom} {p.nom}</strong>
                  <span>{p.telephone || '—'} · {p.email}</span>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="nc-action-panel">
              <p>Patient sélectionné : <strong>{selected.prenom} {selected.nom}</strong></p>
              <div className="nc-action-row">
                <select className="input" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                  {Object.entries(PRIORITE_FR).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  onClick={() => createTicket(selected.id)}
                >
                  {loading ? 'Création...' : '🎫 Créer ticket'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <div className="nc-new-card card">
          <h3>Patient introuvable — création rapide</h3>
          <p className="nc-hint">Un compte de connexion sera créé automatiquement pour le patient.</p>
          <form onSubmit={createPatientAndTicket} className="nc-mini-form">
            <div className="nc-form-grid">
              <div>
                <label>Nom complet *</label>
                <input className="input" value={newPatient.nom} onChange={(e) => setNewPatient({ ...newPatient, nom: e.target.value })} placeholder="Ex: Fatou Fall" required />
              </div>
              <div>
                <label>Téléphone *</label>
                <input className="input" value={newPatient.telephone} onChange={(e) => setNewPatient({ ...newPatient, telephone: e.target.value })} placeholder="+221 77 123 45 67" required />
              </div>
              <div>
                <label>Âge</label>
                <input className="input" type="number" min="0" max="120" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="Ex: 35" />
              </div>
              <div>
                <label>Triage</label>
                <select className="input" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                  {Object.entries(PRIORITE_FR).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Création...' : '✔ Créer patient + ticket'}
            </button>
          </form>
        </div>
      )}

      {showNewForm && query.length < 2 && (
        <div className="nc-empty card">
          <p>Commencez par taper un nom ou un numéro de téléphone</p>
        </div>
      )}

      {lastResult && (
        <div className="nc-success card">
          <h3>✅ Consultation enregistrée</h3>
          <div className="nc-success-grid">
            <div>
              <span className="nc-label">Ticket</span>
              <strong className="nc-ticket-num">{lastResult.ticket?.numero}</strong>
            </div>
            <div>
              <span className="nc-label">Patient</span>
              <strong>{lastResult.patient?.prenom} {lastResult.patient?.nom}</strong>
            </div>
          </div>
          {lastResult.credentials && (
            <div className="nc-credentials">
              <p><strong>Identifiants de connexion patient :</strong></p>
              <p>Email : <code>{lastResult.credentials.email}</code></p>
              <p>Mot de passe : <code>{lastResult.credentials.password}</code></p>
              <p className="nc-hint">Communiquez ces identifiants au patient pour qu'il accède à son espace.</p>
            </div>
          )}
          <div className="nc-success-actions">
            <Link to="/app/file-attente" className="btn btn-outline">Voir la file</Link>
            <button type="button" className="btn btn-primary" onClick={() => setLastResult(null)}>Nouveau patient</button>
          </div>
        </div>
      )}
    </div>
  );
}
