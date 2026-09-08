import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { formatAge, formatDateTime, ANALYSES_TYPES } from '../utils/labels';
import '../components/PaymentModal.css';
import './Consultation.css';

const VITALS_FIELDS = [
  { key: 'tension', label: 'Tension artérielle', placeholder: '120/80 mmHg' },
  { key: 'temperature', label: 'Température', placeholder: '37.0 °C' },
  { key: 'poids', label: 'Poids', placeholder: '70 kg' },
  { key: 'taille', label: 'Taille', placeholder: '170 cm' },
  { key: 'pouls', label: 'Pouls', placeholder: '72 bpm' },
  { key: 'frequence_respiratoire', label: 'Fréq. respiratoire', placeholder: '16 /min' },
];

const TABS = [
  { id: 'diagnostic', label: 'Diagnostic', icon: '🩺' },
  { id: 'analyse', label: 'Demander analyse', icon: '🧪' },
  { id: 'ordonnance', label: 'Prescrire', icon: '💊' },
];

export default function Consultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [tab, setTab] = useState('diagnostic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [diagnostic, setDiagnostic] = useState('');
  const [notes, setNotes] = useState('');
  const [vitals, setVitals] = useState({});
  const [typeAnalyse, setTypeAnalyse] = useState(ANALYSES_TYPES[0]);
  const [meds, setMeds] = useState([{ nom: '', dosage: '', duree: '7 jours' }]);
  const [instructions, setInstructions] = useState('');
  const [alertes, setAlertes] = useState([]);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [stockMeds, setStockMeds] = useState([]);
  const [callingNext, setCallingNext] = useState(false);

  useEffect(() => {
    api.getPatient(id)
      .then((r) => {
        setPatient(r.data.patient);
        setHistorique(r.data.historique || []);
      })
      .catch(() => navigate('/app/patients'))
      .finally(() => setLoading(false));
    api.getMedicaments().then((r) => setStockMeds(r.data || [])).catch(() => {});
  }, [id, navigate]);

  const saveDiagnostic = async (e) => {
    e.preventDefault();
    if (!diagnostic.trim()) {
      toast('Veuillez saisir un diagnostic', 'error');
      return;
    }
    setSaving(true);
    try {
      const vitalsStr = Object.entries(vitals).filter(([, v]) => v).map(([k, v]) => `${VITALS_FIELDS.find(f => f.key === k)?.label || k}: ${v}`).join(' | ');
      const fullNotes = [vitalsStr, notes.trim()].filter(Boolean).join('\n');
      await api.addHistorique({ patient_id: parseInt(id, 10), diagnostic: diagnostic.trim(), notes: fullNotes });
      toast('Consultation enregistrée avec succès');
      setDiagnostic('');
      setNotes('');
      setVitals({});
      const r = await api.getPatient(id);
      setHistorique(r.data.historique || []);
      setTab('diagnostic');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveAnalyse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAnalyse({ patient_id: parseInt(id, 10), type_analyse: typeAnalyse });
      toast(`Analyse « ${typeAnalyse} » demandée au laboratoire`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkAlerts = async (validMeds) => {
    setCheckingAlerts(true);
    try {
      const res = await api.checkPrescription({
        patient_id: parseInt(id, 10),
        medicaments: validMeds,
      });
      setAlertes(res.data.alerts || []);
      return res.data;
    } catch {
      return { alerts: [], hasDanger: false };
    } finally {
      setCheckingAlerts(false);
    }
  };

  const saveOrdonnance = async (e, force = false) => {
    e.preventDefault();
    const validMeds = meds.filter((m) => m.nom.trim());
    if (!validMeds.length) {
      toast('Ajoutez au moins un médicament', 'error');
      return;
    }

    if (!force) {
      const check = await checkAlerts(validMeds);
      if (check.hasDanger) {
        toast('Alertes médicales détectées — confirmez pour continuer', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      await api.createOrdonnance({
        patient_id: parseInt(id, 10),
        medicaments: validMeds,
        instructions: instructions.trim() || 'Suivre le traitement prescrit',
        force: force || undefined,
      });
      toast('Ordonnance créée — le patient sera notifié');
      setMeds([{ nom: '', dosage: '', duree: '7 jours' }]);
      setInstructions('');
      setAlertes([]);
    } catch (err) {
      if (err.status === 422 && err.data?.alerts) {
        setAlertes(err.data.alerts);
        toast('Allergie ou interaction détectée', 'error');
      } else {
        toast(err.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const addMedLine = () => setMeds([...meds, { nom: '', dosage: '', duree: '7 jours' }]);

  const finishAndCallNext = async () => {
    if (!window.confirm('Terminer cette consultation et appeler le patient suivant ?')) return;
    setCallingNext(true);
    try {
      const res = await api.callNextPatient({ patient_id: parseInt(id, 10) });
      if (res.data?.next) {
        toast(`✅ Consultation terminée — ${res.data.next.numero} appelé`);
      } else {
        toast('✅ Consultation terminée — aucun patient en attente');
      }
      navigate('/app/queue');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCallingNext(false);
    }
  };
  const updateMed = (i, field, val) => {
    const next = [...meds];
    next[i] = { ...next[i], [field]: val };
    setMeds(next);
    if (field === 'nom' && val.length > 3) {
      checkAlerts(next.filter((m) => m.nom.trim()));
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!patient) return null;

  return (
    <div className="consultation-page">
      <PageHeader
        title="Consultation médicale"
        subtitle={`Dossier de ${patient.prenom} ${patient.nom}`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={finishAndCallNext}
              disabled={callingNext}
            >
              {callingNext ? 'Appel...' : '✓ Terminer & appeler le suivant'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(`/app/patients/${id}`)}>
              Voir le dossier
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/app/patients')}>
              ← Liste patients
            </button>
          </div>
        }
      />

      <div className="consultation-layout">
        <aside className="consultation-sidebar card">
          <div className="sidebar-patient">
            <div className="sidebar-avatar">{patient.prenom?.[0]}{patient.nom?.[0]}</div>
            <h3>{patient.prenom} {patient.nom}</h3>
            {formatAge(patient.date_naissance) && <p>{formatAge(patient.date_naissance)}</p>}
            {patient.groupe_sanguin && <p>Groupe sanguin : <strong>{patient.groupe_sanguin}</strong></p>}
            {patient.allergies && (
              <div className="sidebar-allergy">⚠️ {patient.allergies}</div>
            )}
            <p className="sidebar-qr">{patient.qr_code}</p>
          </div>
          <div className="sidebar-history">
            <h4>Dernières consultations</h4>
            {historique.length === 0 ? (
              <p className="section-empty">Première visite</p>
            ) : (
              historique.slice(0, 4).map((h) => (
                <div key={h.id} className="mini-history">
                  <small>{formatDateTime(h.date_consultation)}</small>
                  <p>{h.diagnostic}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="consultation-main card">
          <div className="consultation-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'diagnostic' && (
            <form className="consultation-form" onSubmit={saveDiagnostic}>
              <h3>Enregistrer le diagnostic</h3>
              <p className="form-hint">Décrivez clairement le diagnostic et les recommandations pour le patient.</p>
              <label>Constantes vitales</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {VITALS_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.label}</label>
                    <input className="input" value={vitals[f.key] || ''} onChange={(e) => setVitals({ ...vitals, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <label>Diagnostic *</label>
              <textarea
                className="input textarea"
                rows={4}
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                placeholder="Ex : Hypertension artérielle légère — surveillance recommandée"
              />
              <label>Notes complémentaires</label>
              <textarea
                className="input textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conseils, prochain contrôle, régime alimentaire..."
              />
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : '✓ Enregistrer la consultation'}
              </button>
            </form>
          )}

          {tab === 'analyse' && (
            <form className="consultation-form" onSubmit={saveAnalyse}>
              <h3>Demander une analyse au laboratoire</h3>
              <p className="form-hint">Le laboratoire recevra la demande et le patient sera notifié des résultats.</p>
              <label>Type d'analyse</label>
              <select className="input" value={typeAnalyse} onChange={(e) => setTypeAnalyse(e.target.value)}>
                {ANALYSES_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Envoi...' : '🧪 Envoyer au laboratoire'}
              </button>
            </form>
          )}

          {tab === 'ordonnance' && (
            <form className="consultation-form" onSubmit={(e) => saveOrdonnance(e, false)}>
              <h3>Prescrire une ordonnance</h3>
              <p className="form-hint">Vérification automatique des allergies et interactions médicamenteuses.</p>

              {alertes.length > 0 && (
                <div className="alertes-panel">
                  <strong>⚠️ Alertes médicales ({alertes.length})</strong>
                  {alertes.map((a, i) => (
                    <div key={i} className={`medical-alert ${a.severity}`}>{a.message}</div>
                  ))}
                  {alertes.some((a) => a.severity === 'danger') && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: 8 }}
                      onClick={(e) => saveOrdonnance(e, true)}
                    >
                      Forcer la prescription (médecin responsable)
                    </button>
                  )}
                </div>
              )}

              {checkingAlerts && <p className="form-hint">Vérification des alertes...</p>}
              {meds.map((m, i) => (
                <div key={i} className="med-row">
                  <select className="input" value={m.nom} onChange={(e) => updateMed(i, 'nom', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {stockMeds.map((sm) => (
                      <option key={sm.id} value={sm.nom}>{sm.nom} (Stock: {sm.stock})</option>
                    ))}
                  </select>
                  <input className="input" placeholder="Dosage (ex: 1 cp x2/j)" value={m.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)} />
                  <input className="input" placeholder="Durée" value={m.duree} onChange={(e) => updateMed(i, 'duree', e.target.value)} />
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" onClick={addMedLine}>+ Ajouter un médicament</button>
              <label style={{ marginTop: 16 }}>Instructions au patient</label>
              <textarea className="input textarea" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Précautions, horaires de prise..." />
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 16 }}>
                {saving ? 'Création...' : '💊 Créer l\'ordonnance'}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
