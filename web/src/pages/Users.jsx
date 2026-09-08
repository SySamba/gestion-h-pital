import React from 'react';
import { api, ROLE_LABELS } from '../api/api';
import DataTable, { Badge } from './DataTable';
import PageHeader from '../components/PageHeader';

export default function Users() {
  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes — médecins, patients, personnel"
      />
      <DataTable
        title=""
        fetchFn={api.getUsers}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'nom', label: 'Nom complet', render: (r) => `${r.prenom} ${r.nom}` },
          { key: 'email', label: 'Email' },
          { key: 'telephone', label: 'Téléphone', render: (r) => r.telephone || '—' },
          { key: 'role', label: 'Rôle', render: (r) => (
            <span className="badge badge-en_cours">{ROLE_LABELS[r.role] || r.role}</span>
          )},
          { key: 'actif', label: 'Statut', render: (r) => (
            <Badge status={r.actif ? 'termine' : 'annule'} label={r.actif ? 'Actif' : 'Inactif'} />
          )},
        ]}
      />
    </div>
  );
}
