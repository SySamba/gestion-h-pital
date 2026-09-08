const API_URL = import.meta.env.DEV ? '/api/v1' : '/api/v1';



const getToken = () => localStorage.getItem('token');



const request = async (endpoint, options = {}) => {

  const token = getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {

    ...options,

    headers: {

      'Content-Type': 'application/json',

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...options.headers,

    },

  });

  const data = await res.json();

  if (!res.ok) {

    const err = new Error(data.message || 'Erreur réseau');

    err.status = res.status;

    err.data = data.data;

    throw err;

  }

  return data;

};



export const api = {

  getSettings: () => request('/settings'),

  updateSettings: (body) => request('/settings', { method: 'PATCH', body: JSON.stringify(body) }),

  getSalles: () => request('/salles'),

  getSallesActives: () => request('/salles/actives'),

  createSalle: (body) => request('/salles', { method: 'POST', body: JSON.stringify(body) }),

  updateSalle: (id, body) => request(`/salles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteSalle: (id) => request(`/salles/${id}`, { method: 'DELETE' }),

  getGuichets: () => request('/guichets'),

  getGuichetsActifs: () => request('/guichets/actifs'),

  createGuichet: (body) => request('/guichets', { method: 'POST', body: JSON.stringify(body) }),

  deleteGuichet: (id) => request(`/guichets/${id}`, { method: 'DELETE' }),

  getMedecinsAdmin: () => request('/admin/medecins'),

  createStaff: (body) => request('/admin/personnel', { method: 'POST', body: JSON.stringify(body) }),

  updateStaff: (id, body) => request(`/admin/personnel/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  login: (email, password) =>

    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (body) =>

    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request('/auth/me'),



  getPatients: () => request('/patients'),

  getPatient: (id) => request(`/patients/${id}`),

  getPatientTimeline: (id) => request(`/patients/${id}/timeline`),

  exportDossier: (id) => {

    const token = getToken();

    return fetch(`${API_URL}/patients/${id}/export`, {

      headers: token ? { Authorization: `Bearer ${token}` } : {},

    }).then((res) => {

      if (!res.ok) throw new Error('Export échoué');

      return res.blob();

    });

  },

  getMyProfile: () => request('/patients/me'),
  updateMyProfile: (body) => request('/patients/me', { method: 'PATCH', body: JSON.stringify(body) }),

  registerPatient: (body) =>

    request('/patients/register', { method: 'POST', body: JSON.stringify(body) }),

  searchPatients: (q) => request(`/patients/search?q=${encodeURIComponent(q)}`),

  consultationExpress: (body) =>

    request('/reception/consultation-express', { method: 'POST', body: JSON.stringify(body) }),

  addHistorique: (body) =>

    request('/patients/historique', { method: 'POST', body: JSON.stringify(body) }),



  getTickets: () => request('/tickets'),

  getQueue: () => request('/tickets/queue'),

  getQueueLive: () => request('/tickets/queue/live'),

  getQueueDisplay: () => request('/tickets/queue/display'),

  getAnnounceAudio: (numero) =>
    request(`/tickets/queue/announce-audio${numero ? `?numero=${encodeURIComponent(numero)}` : ''}`),

  getTtsStatus: () => request('/tts/status'),

  getMyQueuePosition: () => request('/tickets/my-position'),

  buyTicket: (body) => request('/tickets', { method: 'POST', body: JSON.stringify(body) }),

  generateTicket: (body) =>

    request('/tickets/generate', { method: 'POST', body: JSON.stringify(body) }),

  updateTicket: (id, body) =>

    request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(typeof body === 'string' ? { statut: body } : body) }),

  updateTicketPriority: (id, priorite) =>

    request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ priorite }) }),

  callNextPatient: (body) =>
    request('/tickets/queue/call-next', { method: 'POST', body: JSON.stringify(body || {}) }),



  simulerPaiement: (body) =>

    request('/paiements/simuler', { method: 'POST', body: JSON.stringify(body) }),

  confirmerPaiement: (id, statut = 'succes') =>

    request(`/paiements/${id}/confirmer`, { method: 'POST', body: JSON.stringify({ statut }) }),

  getPaiementsHistorique: () => request('/paiements/historique'),



  getMedecins: () => request('/medecins'),

  getRdv: () => request('/rendez-vous'),

  getRdvToday: () => request('/rendez-vous/today'),

  createRdv: (body) =>

    request('/rendez-vous', { method: 'POST', body: JSON.stringify(body) }),

  updateRdv: (id, body) =>

    request(`/rendez-vous/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  sendRdvSms: (id) =>

    request(`/rendez-vous/${id}/sms-rappel`, { method: 'POST' }),

  getDisponibilites: (medecinId) => request(`/rendez-vous/disponibilites/${medecinId}`),



  getAnalyses: () => request('/analyses'),

  createAnalyse: (body) =>

    request('/analyses', { method: 'POST', body: JSON.stringify(body) }),

  updateAnalyse: (id, body) =>

    request(`/analyses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  uploadAnalyseResult: (id, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_URL}/analyses/${id}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload échoué');
      return data;
    });
  },

  createUrgenceAlert: (body) =>
    request('/urgence', { method: 'POST', body: JSON.stringify(body) }),

  getUrgenceAlerts: () => request('/urgence'),

  updateUrgenceAlert: (id, statut) =>
    request(`/urgence/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) }),



  getOrdonnances: () => request('/ordonnances'),

  createOrdonnance: (body) =>

    request('/ordonnances', { method: 'POST', body: JSON.stringify(body) }),

  checkPrescription: (body) =>

    request('/ordonnances/check', { method: 'POST', body: JSON.stringify(body) }),

  deliverOrdonnance: (id) => request(`/ordonnances/${id}/deliver`, { method: 'PATCH' }),
  getOrdonnancePdf: (id) => {
    const token = getToken();
    return fetch(`${API_URL}/ordonnances/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (!res.ok) throw new Error('Téléchargement échoué');
      return res.blob();
    });
  },



  getMedicaments: () => request('/medicaments'),

  createMedicament: (body) =>
    request('/medicaments', { method: 'POST', body: JSON.stringify(body) }),

  updateMedicament: (id, body) =>
    request(`/medicaments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteMedicament: (id) =>
    request(`/medicaments/${id}`, { method: 'DELETE' }),

  adjustStock: (id, body) =>
    request(`/medicaments/${id}/stock`, { method: 'PATCH', body: JSON.stringify(body) }),

  importMedicaments: (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_URL}/medicaments/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import échoué');
      return data;
    });
  },

  downloadMedicamentTemplate: () => {
    const token = getToken();
    return fetch(`${API_URL}/medicaments/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (!res.ok) throw new Error('Téléchargement échoué');
      return res.blob();
    });
  },

  createVente: (body) =>

    request('/ventes', { method: 'POST', body: JSON.stringify(body) }),

  getVentes: () => request('/ventes'),

  getEtablissements: () => request('/etablissements'),

  createEtablissement: (body) =>

    request('/etablissements', { method: 'POST', body: JSON.stringify(body) }),



  // Caisse — Caissier

  getCaisseDashboard: () => request('/caisse/dashboard'),

  openCaisse: (body) =>
    request('/caisse/ouvrir', { method: 'POST', body: JSON.stringify(body) }),

  closeCaisse: (body) =>
    request('/caisse/cloturer', { method: 'POST', body: JSON.stringify(body) }),

  getCaisseStatus: () => request('/caisse/status'),

  encaisser: (body) =>
    request('/caisse/encaisser', { method: 'POST', body: JSON.stringify(body) }),

  getTransactions: (params = '') => request(`/caisse/transactions${params}`),

  createFacture: (body) =>
    request('/factures', { method: 'POST', body: JSON.stringify(body) }),

  getFactures: (params = '') => request(`/factures${params}`),

  getFacturesARecouvrer: () => request('/factures/a-recouvrer'),

  getFacture: (id) => request(`/factures/${id}`),

  getFacturePdf: (id) => {
    const token = getToken();
    return fetch(`${API_URL}/factures/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (!res.ok) throw new Error('Téléchargement échoué');
      return res.blob();
    });
  },

  rembourser: (body) =>
    request('/caisse/rembourser', { method: 'POST', body: JSON.stringify(body) }),

  validerRemboursement: (id) =>
    request(`/caisse/remboursement/${id}/valider`, { method: 'PATCH' }),

  searchCaisse: (q) => request(`/caisse/search?q=${encodeURIComponent(q)}`),



  getSmsHistory: () => request('/sms/historique'),



  getDashboard: () => request('/dashboard/stats'),

  getOverview: () => request('/dashboard/overview'),

  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  getUsers: () => request('/users'),

  updateUser: (id, body) =>

    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),



  getNotifications: () => request('/notifications'),

  markNotificationRead: (id) =>

    request(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>

    request('/notifications/read-all', { method: 'PATCH' }),

  // Certificats médicaux
  getCertificats: () => request('/certificats'),
  getCertificatTypes: () => request('/certificats/types'),
  getCertificat: (id) => request(`/certificats/${id}`),
  createCertificat: (body) => request('/certificats', { method: 'POST', body: JSON.stringify(body) }),
  deleteCertificat: (id) => request(`/certificats/${id}`, { method: 'DELETE' }),

  // Lits & hospitalisation
  getLits: () => request('/lits'),
  createLit: (body) => request('/lits', { method: 'POST', body: JSON.stringify(body) }),
  updateLit: (id, body) => request(`/lits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteLit: (id) => request(`/lits/${id}`, { method: 'DELETE' }),

  getHospitalisations: () => request('/hospitalisations'),
  getHospitalisationStats: () => request('/hospitalisations/stats'),
  admettreHospitalisation: (body) => request('/hospitalisations/admettre', { method: 'POST', body: JSON.stringify(body) }),
  sortirHospitalisation: (id, body) => request(`/hospitalisations/${id}/sortie`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Assurances / tiers payant
  getAssurances: () => request('/assurances'),
  getAssuranceTypes: () => request('/assurances/types'),
  createAssurance: (body) => request('/assurances', { method: 'POST', body: JSON.stringify(body) }),
  updateAssurance: (id, body) => request(`/assurances/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAssurance: (id) => request(`/assurances/${id}`, { method: 'DELETE' }),

  getPatientAssurances: () => request('/patient-assurances'),
  attachPatientAssurance: (body) => request('/patient-assurances', { method: 'POST', body: JSON.stringify(body) }),
  detachPatientAssurance: (id) => request(`/patient-assurances/${id}`, { method: 'DELETE' }),

};



export const ROLE_LABELS = {

  patient: 'Patient',

  medecin: 'Médecin',

  laborantin: 'Laborantin',

  pharmacien: 'Pharmacien',

  receptionniste: 'Réception',

  caissier: 'Caissier',

  admin: 'Administrateur',

};

