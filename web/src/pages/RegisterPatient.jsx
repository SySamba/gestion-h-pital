import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../api/api';

import { useToast } from '../context/ToastContext';

import PageHeader from '../components/PageHeader';

import './NouvelleConsultation.css';



export default function RegisterPatient() {

  const navigate = useNavigate();

  const { toast } = useToast();

  const [form, setForm] = useState({

    email: '', password: 'password123', nom: '', prenom: '', telephone: '',

    date_naissance: '', sexe: 'F', allergies: '', adresse: 'Dakar, Sénégal',

  });

  const [credentials, setCredentials] = useState(null);

  const [autoEmail, setAutoEmail] = useState(true);



  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));



  const submit = async (e) => {

    e.preventDefault();

    try {

      const body = { ...form };

      if (autoEmail && !body.email.trim()) delete body.email;

      const res = await api.registerPatient(body);

      setCredentials(res.data.credentials || { email: body.email, password: body.password });

      toast('Patient enregistré — compte de connexion actif');

    } catch (err) {

      toast(err.message, 'error');

    }

  };



  return (

    <div>

      <PageHeader

        title="Enregistrer un patient"

        subtitle="Option B — Le réceptionniste crée le compte (le patient pourra se connecter)"

        action={<button type="button" className="btn btn-outline" onClick={() => navigate('/app/patients')}>← Retour</button>}

      />



      <div className="card" style={{ marginBottom: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>

        <p><strong>Double système :</strong> Le patient peut aussi créer son compte seul (Option A — page inscription publique). Ici, vous créez le compte pour lui avec identifiants de connexion.</p>

      </div>



      {credentials ? (

        <div className="nc-success card">

          <h3>✅ Patient enregistré</h3>

          <div className="nc-credentials">

            <p><strong>Identifiants à communiquer au patient :</strong></p>

            <p>Email : <code>{credentials.email}</code></p>

            <p>Mot de passe : <code>{credentials.password}</code></p>

            <p className="nc-hint">Le patient peut se connecter sur la page Login avec ces identifiants.</p>

          </div>

          <div className="nc-success-actions">

            <button type="button" className="btn btn-primary" onClick={() => navigate('/app/nouvelle-consultation')}>

              Créer un ticket

            </button>

            <button type="button" className="btn btn-outline" onClick={() => { setCredentials(null); setForm({ email: '', password: 'password123', nom: '', prenom: '', telephone: '', date_naissance: '', sexe: 'F', allergies: '', adresse: 'Dakar, Sénégal' }); }}>

              Nouveau patient

            </button>

          </div>

        </div>

      ) : (

        <form className="card register-form" onSubmit={submit}>

          <div className="form-grid">

            <div>

              <label>Prénom *</label>

              <input className="input" value={form.prenom} onChange={(e) => set('prenom', e.target.value)} required />

            </div>

            <div>

              <label>Nom *</label>

              <input className="input" value={form.nom} onChange={(e) => set('nom', e.target.value)} required />

            </div>

            <div>

              <label>Téléphone * (+221)</label>

              <input className="input" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+221 77 000 00 00" required />

            </div>

            <div>

              <label>Mot de passe initial</label>

              <input className="input" value={form.password} onChange={(e) => set('password', e.target.value)} />

            </div>

            <div className="form-full">

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                <input type="checkbox" checked={autoEmail} onChange={(e) => setAutoEmail(e.target.checked)} />

                Générer l'email automatiquement depuis le téléphone

              </label>

            </div>

            {!autoEmail && (

              <div className="form-full">

                <label>Email *</label>

                <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required={!autoEmail} />

              </div>

            )}

            <div>

              <label>Date de naissance</label>

              <input className="input" type="date" value={form.date_naissance} onChange={(e) => set('date_naissance', e.target.value)} />

            </div>

            <div>

              <label>Sexe</label>

              <select className="input" value={form.sexe} onChange={(e) => set('sexe', e.target.value)}>

                <option value="F">Femme</option>

                <option value="M">Homme</option>

              </select>

            </div>

            <div className="form-full">

              <label>Adresse</label>

              <input className="input" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />

            </div>

            <div className="form-full">

              <label>Allergies connues</label>

              <input className="input" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Ex: Pénicilline" />

            </div>

          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }}>✓ Enregistrer et activer le compte</button>

        </form>

      )}

    </div>

  );

}

