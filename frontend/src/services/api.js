import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const getToken = async () => AsyncStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Erreur réseau');
  }
  return data;
};

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  getPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  getSettings: () => request('/settings'),
  getMyProfile: () => request('/patients/me'),
  registerPatient: (body) =>
    request('/patients/register', { method: 'POST', body: JSON.stringify(body) }),
  addHistorique: (body) =>
    request('/patients/historique', { method: 'POST', body: JSON.stringify(body) }),

  getTickets: () => request('/tickets'),
  getQueue: () => request('/tickets/queue'),
  buyTicket: (body) => request('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  generateTicket: (body) =>
    request('/tickets/generate', { method: 'POST', body: JSON.stringify(body) }),
  updateTicket: (id, statut) =>
    request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) }),

  getMedecins: () => request('/medecins'),
  getRdv: () => request('/rendez-vous'),
  getRdvToday: () => request('/rendez-vous/today'),
  createRdv: (body) =>
    request('/rendez-vous', { method: 'POST', body: JSON.stringify(body) }),
  updateRdv: (id, body) =>
    request(`/rendez-vous/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getAnalyses: () => request('/analyses'),
  createAnalyse: (body) =>
    request('/analyses', { method: 'POST', body: JSON.stringify(body) }),
  updateAnalyse: (id, body) =>
    request(`/analyses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getOrdonnances: () => request('/ordonnances'),
  createOrdonnance: (body) =>
    request('/ordonnances', { method: 'POST', body: JSON.stringify(body) }),

  getMedicaments: () => request('/medicaments'),
  createMedicament: (body) =>
    request('/medicaments', { method: 'POST', body: JSON.stringify(body) }),
  updateMedicament: (id, body) =>
    request(`/medicaments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getVentes: () => request('/ventes'),
  createVente: (body) =>
    request('/ventes', { method: 'POST', body: JSON.stringify(body) }),

  getDashboard: () => request('/dashboard/stats'),
  getUsers: () => request('/users'),
  updateUser: (id, body) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),
};
