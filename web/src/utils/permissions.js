/** Admin = accès total à toute la plateforme */
export const isAdmin = (role) => role === 'admin';

export const canConsult = (role) => isAdmin(role) || role === 'medecin';

export const canManagePatients = (role) =>
  isAdmin(role) || ['medecin', 'receptionniste'].includes(role);

export const canPharmacy = (role) => isAdmin(role) || role === 'pharmacien';

export const canLab = (role) => isAdmin(role) || role === 'laborantin';

export const canReception = (role) =>
  isAdmin(role) || ['receptionniste', 'medecin'].includes(role);
