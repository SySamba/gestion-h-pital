export const STATUT_APPEL_FR = {
  en_attente: 'En attente',
  appele: 'Appelé — veuillez vous présenter',
  en_consultation: 'En consultation',
};

export const STATUT_FR = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
  planifie: 'Planifié',
  confirme: 'Confirmé',
  demande: 'Demandé',
  active: 'Active',
  delivree: 'Délivrée',
  expiree: 'Expirée',
};

export const PRIORITE_FR = {
  normale: '🟢 Normale',
  urgente: '🟠 Urgente',
  tres_urgente: '🔴 Très urgente',
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('fr-SN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }) : '—';

export const formatDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('fr-SN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';

export const formatAge = (dateNaissance) => {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const age = Math.floor((Date.now() - birth) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} ans`;
};

export const formatFcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

export const ANALYSES_TYPES = [
  'Numération formule sanguine (NFS)',
  'Glycémie à jeun',
  'Test Rapide Paludisme (TDR)',
  'ECG',
  'Bilan lipidique',
  'Créatininémie',
  'Radiographie thorax',
  'Groupage sanguin',
];
