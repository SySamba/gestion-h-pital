import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DataTable, { Badge } from './DataTable';
import PageHeader from '../components/PageHeader';
import { STATUT_FR, ANALYSES_TYPES } from '../utils/labels';

const isImageUrl = (url) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url || '');
const isPdfUrl = (url) => /\.pdf(\?|$)/i.test(url || '');

function ResultViewer({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card analyse-viewer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Résultat d'analyse</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Fermer</button>
        </div>
        {isImageUrl(url) ? (
          <img src={url} alt="Résultat analyse" className="analyse-viewer-img" />
        ) : isPdfUrl(url) ? (
          <iframe title="PDF analyse" src={url} className="analyse-viewer-pdf" />
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">Ouvrir le document</a>
        )}
        <a href={url} target="_blank" rel="noreferrer" className="form-hint" style={{ display: 'block', marginTop: 12 }}>
          Télécharger / ouvrir dans un nouvel onglet
        </a>
      </div>
    </div>
  );
}

export default function Analyses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState([]);
  const [typeAnalyse, setTypeAnalyse] = useState(ANALYSES_TYPES[0]);
  const [resultModal, setResultModal] = useState(null);
  const [resultText, setResultText] = useState('');
  const [uploadTarget, setUploadTarget] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const canRequest = ['medecin', 'admin'].includes(user?.role);

  useEffect(() => {
    if (!canRequest) return;
    api.getPatients().then((r) => setPatients(r.data || [])).catch(() => {});
  }, [canRequest]);

  const requestAnalyse = async (e) => {
    e.preventDefault();
    if (!patientId) {
      toast('Sélectionnez un patient', 'error');
      return;
    }
    try {
      await api.createAnalyse({ patient_id: parseInt(patientId, 10), type_analyse: typeAnalyse });
      toast('Analyse demandée — le laboratoire a été notifié');
      setShowForm(false);
      setPatientId('');
      window.location.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const submitResult = async () => {
    if (!resultText.trim()) {
      toast('Saisissez le résultat de l\'analyse', 'error');
      return;
    }
    try {
      await api.updateAnalyse(resultModal, { statut: 'termine', resultat_texte: resultText });
      toast('Résultat enregistré — patient notifié');
      setResultModal(null);
      setResultText('');
      window.location.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setUploading(true);
    try {
      await api.uploadAnalyseResult(uploadTarget, file);
      toast('Document importé — patient notifié');
      setUploadTarget(null);
      window.location.reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderResult = (r) => {
    if (r.resultat_url) {
      return (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setViewerUrl(r.resultat_url)}>
          {isPdfUrl(r.resultat_url) ? '📄 Voir PDF' : isImageUrl(r.resultat_url) ? '🖼️ Voir image' : '📎 Voir document'}
        </button>
      );
    }
    if (r.resultat_texte) return r.resultat_texte;
    return r.statut === 'termine' ? 'Disponible' : 'En attente';
  };

  return (
    <div>
      <PageHeader
        title="Analyses médicales"
        subtitle="Demandes, résultats texte et documents PDF / images"
        action={
          canRequest ? (
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              + Demander une analyse
            </button>
          ) : null
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {showForm && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={requestAnalyse}>
          <h3 style={{ marginBottom: 16 }}>Nouvelle demande d'analyse</h3>
          <label>Patient</label>
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">— Sélectionner un patient —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>
          <label>Type d'analyse</label>
          <select className="input" value={typeAnalyse} onChange={(e) => setTypeAnalyse(e.target.value)}>
            {ANALYSES_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="submit" className="btn btn-primary">Envoyer au laboratoire</button>
        </form>
      )}

      {resultModal && (
        <div className="modal-overlay">
          <div className="modal card">
            <h3>Saisir le résultat (texte)</h3>
            <textarea
              className="input textarea"
              rows={5}
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              placeholder="Résultats de l'analyse en langage clair..."
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-primary" onClick={submitResult}>Valider</button>
              <button type="button" className="btn btn-outline" onClick={() => setResultModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {viewerUrl && <ResultViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}

      <DataTable
        title=""
        fetchFn={api.getAnalyses}
        columns={[
          { key: 'type', label: 'Analyse', render: (r) => r.type_analyse },
          { key: 'patient', label: 'Patient', render: (r) => `${r.patient_prenom} ${r.patient_nom}` },
          { key: 'statut', label: 'Statut', render: (r) => <Badge status={r.statut} label={STATUT_FR[r.statut]} /> },
          { key: 'resultat', label: 'Résultat', render: renderResult },
          ...(['laborantin', 'admin'].includes(user?.role)
            ? [{
                key: 'actions',
                label: 'Action',
                render: (r) =>
                  r.statut !== 'termine' ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setResultModal(r.id)}>
                        Texte
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={uploading}
                        onClick={() => {
                          setUploadTarget(r.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        {uploading && uploadTarget === r.id ? 'Import...' : 'PDF / Image'}
                      </button>
                    </div>
                  ) : '—',
              }]
            : []),
        ]}
      />
    </div>
  );
}
