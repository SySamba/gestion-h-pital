import { Platform } from 'react-native';

const LOCAL_HOST =
  Platform.OS === 'android' ? '10.0.2.2' : Platform.OS === 'web' ? 'localhost' : 'localhost';

export const API_URL = __DEV__
  ? `http://${LOCAL_HOST}:3000/api/v1`
  : 'https://votre-api-production.com/api/v1';

export const ROLES = {
  PATIENT: 'patient',
  MEDECIN: 'medecin',
  LABORANTIN: 'laborantin',
  PHARMACIEN: 'pharmacien',
  RECEPTIONNISTE: 'receptionniste',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  patient: 'Patient',
  medecin: 'Médecin',
  laborantin: 'Laborantin',
  pharmacien: 'Pharmacien',
  receptionniste: 'Réception',
  admin: 'Administrateur',
};
