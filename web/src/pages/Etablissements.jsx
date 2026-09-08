import React, { useState } from 'react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import DataTable from './DataTable';
import PageHeader from '../components/PageHeader';

export default function Etablissements() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState({ nom: '', adresse: '', telephone: '', ville: 'Dakar' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.createEtablissement(form);
      toast('Établissement ajouté');
      setShowForm(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Multi-établissements"
        subtitle="Gestion des cliniques et sites MedikaSN"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Nouvel établissement
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 24, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <p>Gérez plusieurs cliniques depuis une seule plateforme. Chaque patient est rattaché à un établissement.</p>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={create}>
          <h3>Ajouter un établissement</h3>
          <label>Nom</label>
          <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          <label>Adresse</label>
          <input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <label>Téléphone</label>
          <input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <label>Ville</label>
          <input className="input" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </form>
      )}

      <DataTable
        key={reloadKey}
        fetchFn={api.getEtablissements}
        columns={[
          { key: 'nom', label: 'Nom' },
          { key: 'adresse', label: 'Adresse' },
          { key: 'telephone', label: 'Téléphone' },
          { key: 'ville', label: 'Ville' },
        ]}
      />
    </div>
  );
}
