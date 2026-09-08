import React, { useEffect, useState, useCallback } from 'react';
import { api, ROLE_LABELS } from '../api/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';

const TABS = [
  { id: 'parametres', label: 'Paramètres système' },
  { id: 'salles', label: 'Salles' },
  { id: 'guichets', label: 'Guichets réception' },
  { id: 'medecins', label: 'Médecins' },
  { id: 'personnel', label: 'Personnel' },
];

const STAFF_ROLES = ['receptionniste', 'medecin', 'laborantin', 'pharmacien', 'admin'];

export default function Administration() {
  const { toast } = useToast();
  const [tab, setTab] = useState('parametres');
  const [settings, setSettings] = useState(null);
  const [salles, setSalles] = useState([]);
  const [guichets, setGuichets] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [salleForm, setSalleForm] = useState({ nom: '', type: 'consultation' });
  const [guichetForm, setGuichetForm] = useState({ nom: '' });
  const [staffForm, setStaffForm] = useState({
    email: '', password: '', nom: '', prenom: '', telephone: '', role: 'receptionniste', specialite: '',
  });

  const load = useCallback(async () => {
    const [s, sal, gui, med, usr] = await Promise.all([
      api.getSettings(),
      api.getSalles(),
      api.getGuichets(),
      api.getMedecinsAdmin(),
      api.getUsers(),
    ]);
    setSettings(s.data);
    setSalles(sal.data || []);
    setGuichets(gui.data || []);
    setMedecins(med.data || []);
    setUsers(usr.data || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.updateSettings(settings);
      setSettings(r.data);
      toast('Paramètres enregistrés');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addSalle = async (e) => {
    e.preventDefault();
    try {
      await api.createSalle(salleForm);
      setSalleForm({ nom: '', type: 'consultation' });
      toast('Salle ajoutée');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const addGuichet = async (e) => {
    e.preventDefault();
    try {
      await api.createGuichet(guichetForm);
      setGuichetForm({ nom: '' });
      toast('Guichet ajouté');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const addStaff = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff(staffForm);
      setStaffForm({ email: '', password: '', nom: '', prenom: '', telephone: '', role: 'receptionniste', specialite: '' });
      toast('Compte créé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const toggleUser = async (user) => {
    try {
      await api.updateStaff(user.id, { actif: !user.actif });
      toast(user.actif ? 'Compte désactivé' : 'Compte activé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const resetPassword = async (user) => {
    const newPwd = window.prompt(`Réinitialiser le mot de passe de ${user.prenom} ${user.nom} ?\nEntrez le nouveau mot de passe :`);
    if (!newPwd) return;
    try {
      await api.updateStaff(user.id, { password: newPwd });
      toast('Mot de passe réinitialisé');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const editMedecinSpecialite = async (medecin) => {
    const spec = window.prompt(`Spécialité du Dr. ${medecin.prenom} ${medecin.nom} :`, medecin.specialite);
    if (spec === null) return;
    try {
      await api.updateStaff(medecin.user_id, { specialite: spec });
      toast('Spécialité mise à jour');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const deactivateSalle = async (id) => {
    await api.deleteSalle(id);
    toast('Salle désactivée');
    load();
  };

  const deactivateGuichet = async (id) => {
    await api.deleteGuichet(id);
    toast('Guichet désactivé');
    load();
  };

  if (!settings) return <div className="card">Chargement...</div>;

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Gestion complète du système hospitalier"
      />

      <div className="admin-tabs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'parametres' && (
        <form className="card" onSubmit={saveSettings}>
          <h3>Paramètres généraux</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label>Nom de l'établissement</label>
              <input className="input" value={settings.nom || ''} onChange={(e) => setSettings({ ...settings, nom: e.target.value })} />
            </div>
            <div>
              <label>Slogan</label>
              <input className="input" value={settings.slogan || ''} onChange={(e) => setSettings({ ...settings, slogan: e.target.value })} />
            </div>
            <div>
              <label>Téléphone</label>
              <input className="input" value={settings.telephone || ''} onChange={(e) => setSettings({ ...settings, telephone: e.target.value })} />
            </div>
            <div>
              <label>Email</label>
              <input className="input" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Adresse</label>
              <input className="input" value={settings.adresse || ''} onChange={(e) => setSettings({ ...settings, adresse: e.target.value })} />
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>Tickets & file d'attente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label>Durée validité ticket (minutes)</label>
              <input
                type="number"
                min="15"
                className="input"
                value={settings.ticket_duree_minutes || 120}
                onChange={(e) => setSettings({ ...settings, ticket_duree_minutes: parseInt(e.target.value, 10) })}
              />
              <p className="form-hint">Après ce délai, le ticket en attente est annulé automatiquement.</p>
            </div>
            <div>
              <label>Prix ticket (FCFA)</label>
              <input
                type="number"
                className="input"
                value={settings.ticket_prix || 5000}
                onChange={(e) => setSettings({ ...settings, ticket_prix: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label>Temps d'attente moyen (min/patient)</label>
              <input
                type="number"
                min="1"
                className="input"
                value={settings.temps_attente_moyen_min || 8}
                onChange={(e) => setSettings({ ...settings, temps_attente_moyen_min: parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label>Répétitions annonce vocale</label>
              <input
                type="number"
                min="1"
                max="5"
                className="input"
                value={settings.annonce_repetitions || 3}
                onChange={(e) => setSettings({ ...settings, annonce_repetitions: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </form>
      )}

      {tab === 'salles' && (
        <>
          <form className="card" style={{ marginBottom: 16 }} onSubmit={addSalle}>
            <h3>Ajouter une salle</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>Nom</label>
                <input className="input" value={salleForm.nom} onChange={(e) => setSalleForm({ ...salleForm, nom: e.target.value })} required />
              </div>
              <div>
                <label>Type</label>
                <select className="input" value={salleForm.type} onChange={(e) => setSalleForm({ ...salleForm, type: e.target.value })}>
                  <option value="consultation">Consultation</option>
                  <option value="urgence">Urgence</option>
                  <option value="laboratoire">Laboratoire</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Ajouter</button>
            </div>
          </form>
          <div className="card">
            <h3>Salles ({salles.filter((s) => s.actif).length} actives)</h3>
            {salles.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>
                  <strong>{s.nom}</strong> — {s.type}
                  {s.medecin_prenom && ` · Dr. ${s.medecin_prenom} ${s.medecin_nom}`}
                  {!s.actif && ' (inactive)'}
                </span>
                {s.actif && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => deactivateSalle(s.id)}>Désactiver</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'guichets' && (
        <>
          <form className="card" style={{ marginBottom: 16 }} onSubmit={addGuichet}>
            <h3>Ajouter un guichet réception</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="input" placeholder="Guichet 3 — Accueil" value={guichetForm.nom} onChange={(e) => setGuichetForm({ nom: e.target.value })} required />
              <button type="submit" className="btn btn-primary">Ajouter</button>
            </div>
          </form>
          <div className="card">
            {guichets.map((g) => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>{g.nom}{!g.actif && ' (inactif)'}</span>
                {g.actif && <button type="button" className="btn btn-outline btn-sm" onClick={() => deactivateGuichet(g.id)}>Désactiver</button>}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'medecins' && (
        <div className="card">
          <h3>Médecins ({medecins.length})</h3>
          {medecins.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <div>
                <strong>Dr. {m.prenom} {m.nom}</strong> — {m.specialite}
                <br />
                <span className="form-hint">{m.email} · {m.telephone || '—'} · {m.actif ? 'Actif' : 'Inactif'}</span>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => editMedecinSpecialite(m)}>✏️ Spécialité</button>
            </div>
          ))}
          <p className="form-hint" style={{ marginTop: 12 }}>Créez un nouveau médecin via l'onglet Personnel (rôle Médecin).</p>
        </div>
      )}

      {tab === 'personnel' && (
        <>
          <form className="card" style={{ marginBottom: 16 }} onSubmit={addStaff}>
            <h3>Créer un compte personnel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <input className="input" placeholder="Prénom" value={staffForm.prenom} onChange={(e) => setStaffForm({ ...staffForm, prenom: e.target.value })} required />
              <input className="input" placeholder="Nom" value={staffForm.nom} onChange={(e) => setStaffForm({ ...staffForm, nom: e.target.value })} required />
              <input className="input" type="email" placeholder="Email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Mot de passe" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} required />
              <input className="input" placeholder="Téléphone" value={staffForm.telephone} onChange={(e) => setStaffForm({ ...staffForm, telephone: e.target.value })} />
              <select className="input" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              {staffForm.role === 'medecin' && (
                <input className="input" placeholder="Spécialité" value={staffForm.specialite} onChange={(e) => setStaffForm({ ...staffForm, specialite: e.target.value })} />
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Créer le compte</button>
          </form>
          <div className="card">
            <h3>Tous les utilisateurs</h3>
            {users.map((u) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>{u.prenom} {u.nom} — {ROLE_LABELS[u.role]} — {u.email}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => resetPassword(u)}>🔑 Mot de passe</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleUser(u)}>
                    {u.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
