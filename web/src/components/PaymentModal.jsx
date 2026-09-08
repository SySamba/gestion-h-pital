import React, { useState } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { formatFcfa } from '../utils/labels';
import './PaymentModal.css';

const OPERATEURS = [
  { id: 'wave', label: 'Wave', icon: '🌊', color: '#1DC8FF' },
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', color: '#FF6600' },
  { id: 'free_money', label: 'Free Money', icon: '🟣', color: '#6B21A8' },
];

export default function PaymentModal({ open, onClose, referenceType, referenceId, montant, onSuccess }) {
  const { toast } = useToast();
  const [operateur, setOperateur] = useState('wave');
  const [telephone, setTelephone] = useState('');
  const [step, setStep] = useState('form');
  const [paiementId, setPaiementId] = useState(null);
  const [recu, setRecu] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep('form');
    setPaiementId(null);
    setRecu(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const initier = async (e) => {
    e.preventDefault();
    if (!telephone || telephone.length < 9) {
      toast('Entrez un numéro de téléphone valide (+221...)', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.simulerPaiement({
        reference_type: referenceType,
        reference_id: referenceId,
        montant,
        operateur,
        telephone,
      });
      setPaiementId(res.data.id);
      setStep('confirm');
      toast('Demande envoyée — confirmez sur votre téléphone (simulation)');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmer = async (succes = true) => {
    setLoading(true);
    try {
      const res = await api.confirmerPaiement(paiementId, succes ? 'succes' : 'echec');
      if (succes) {
        setRecu(res.data.recu);
        setStep('recu');
        toast('Paiement confirmé (simulation)');
        onSuccess?.(res.data);
      } else {
        toast('Paiement annulé', 'error');
        handleClose();
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay payment-overlay" onClick={handleClose}>
      <div className="modal card payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-header">
          <h3>💳 Paiement Mobile Money</h3>
          <span className="payment-badge">SIMULATION</span>
        </div>

        {step === 'form' && (
          <form onSubmit={initier}>
            <p className="payment-amount">{formatFcfa(montant)}</p>
            <p className="form-hint">Choisissez votre opérateur et entrez votre numéro</p>

            <div className="operateur-grid">
              {OPERATEURS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  className={`operateur-btn ${operateur === op.id ? 'active' : ''}`}
                  onClick={() => setOperateur(op.id)}
                  style={{ '--op-color': op.color }}
                >
                  <span className="op-icon">{op.icon}</span>
                  <span>{op.label}</span>
                </button>
              ))}
            </div>

            <label>Numéro de téléphone</label>
            <input
              className="input"
              placeholder="+221 77 123 45 67"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
            />

            <div className="payment-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Envoi...' : 'Payer maintenant'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleClose}>Annuler</button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <div className="payment-confirm">
            <div className="phone-animation">📱</div>
            <h4>Confirmez sur votre téléphone</h4>
            <p>Une notification {OPERATEURS.find((o) => o.id === operateur)?.label} a été envoyée au <strong>{telephone}</strong></p>
            <p className="form-hint">En mode simulation, cliquez ci-dessous pour simuler la confirmation</p>
            <div className="payment-actions">
              <button type="button" className="btn btn-primary" onClick={() => confirmer(true)} disabled={loading}>
                ✓ Simuler confirmation
              </button>
              <button type="button" className="btn btn-outline" onClick={() => confirmer(false)} disabled={loading}>
                ✗ Simuler échec
              </button>
            </div>
          </div>
        )}

        {step === 'recu' && recu && (
          <div className="payment-recu">
            <div className="recu-success">✅ Paiement réussi</div>
            <div className="recu-details">
              <p><strong>Montant :</strong> {formatFcfa(recu.montant)}</p>
              <p><strong>Opérateur :</strong> {recu.operateur}</p>
              <p><strong>Référence :</strong> {recu.reference}</p>
              <p><strong>Date :</strong> {new Date(recu.date).toLocaleString('fr-FR')}</p>
            </div>
            <p className="simulation-note">⚠️ Ceci est une simulation — aucun paiement réel n'a été effectué</p>
            <button type="button" className="btn btn-primary" onClick={handleClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}
