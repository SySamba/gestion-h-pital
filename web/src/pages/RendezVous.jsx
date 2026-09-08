import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from './DataTable';
import PageHeader from '../components/PageHeader';
import PaymentModal from '../components/PaymentModal';
import { STATUT_FR, formatDateShort, formatTime, formatFcfa } from '../utils/labels';
import './ReceptionPages.css';

const RDV_PRIX = 10000;

function groupByHour(rdvs) {
  const groups = {};
  rdvs.forEach((r) => {
    const d = new Date(r.date_heure);
    const hour = d.getHours();
    const key = `${hour}`;
    if (!groups[key]) groups[key] = { hour, label: `${String(hour).padStart(2, '0')}h00`, items: [] };
    groups[key].items.push(r);
  });
  return Object.values(groups).sort((a, b) => a.hour - b.hour);
}

export default function RendezVous() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ medecin_id: '', date: '', time: '09:00', motif: '', patient_id: '' });
  const [payment, setPayment] = useState(null);
  const [lastRdvId, setLastRdvId] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [patients, setPatients] = useState([]);
  const [slotConflict, setSlotConflict] = useState(null);
  const [checkingSlot, setCheckingSlot] = useState(false);

  const isStaff = ['receptionniste', 'admin', 'medecin'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    const fn = user?.role === 'receptionniste' || user?.role === 'admin' ? api.getRdvToday : api.getRdv;
    fn()
      .then((r) => setRdvs(r.data || []))
      .catch(() => setRdvs([]))
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    load();
    api.getMedecins().then((r) => setMedecins(r.data || [])).catch(() => {});
    if (isStaff) api.getPatients().then((r) => setPatients(r.data || [])).catch(() => {});
  }, [load, isStaff]);

  useEffect(() => {
    if (form.medecin_id && form.date) {
      setCheckingSlot(true);
      setSlotConflict(null);
      api.getDisponibilites(form.medecin_id)
        .then((r) => {
          const slots = r.data?.slots || r.data || [];
          const dateStr = form.date;
          const existing = slots.filter((s) => {
            const sDate = new Date(s.date_heure || s);
            return sDate.toISOString().split('T')[0] === dateStr && s.statut !== 'annule';
          });
          if (existing.length > 0) {
            const times = existing.map((s) => {
              const d = new Date(s.date_heure || s);
              return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
            });
            setSlotConflict(`⚠️ Créneaux déjà pris ce jour : ${times.join(', ')}`);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingSlot(false));
    }
  }, [form.medecin_id, form.date]);

  const book = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      toast('Date et heure requises', 'error');
      return;
    }
    if (!form.medecin_id) {
      toast('Sélectionnez un médecin', 'error');
      return;
    }
    try {
      const date_heure = `${form.date} ${form.time}:00`;
      const body = { medecin_id: parseInt(form.medecin_id, 10), date_heure, motif: form.motif };
      if (form.patient_id) body.patient_id = parseInt(form.patient_id, 10);
      const res = await api.createRdv(body);
      toast('RDV planifié — SMS rappel simulé envoyé');
      setLastRdvId(res.data.id);
      if (user?.role === 'patient') {
        setPayment({ referenceType: 'rendez_vous', referenceId: res.data.id, montant: RDV_PRIX });
      }
      setShowForm(false);
      setSlotConflict(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const sendSms = async (id) => {
    try {
      await api.sendRdvSms(id);
      toast('SMS rappel simulé envoyé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const cancelRdv = async (id) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    try {
      await api.updateRdv(id, { statut: 'annule' });
      toast('Rendez-vous annulé');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const groups = groupByHour(rdvs);
  const now = new Date();
  const upcoming = rdvs.filter((r) => new Date(r.date_heure) >= now && r.statut !== 'annule').length;
  const past = rdvs.filter((r) => new Date(r.date_heure) < now).length;

  return (
    <div>
      <PageHeader
        title="Rendez-vous"
        subtitle={
          user?.role === 'patient'
            ? 'Vos rendez-vous médicaux'
            : user?.role === 'receptionniste' || user?.role === 'admin'
              ? "Planning du jour — heures et rappels SMS"
              : 'Planning des consultations'
        }
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Nouveau rendez-vous
          </button>
        }
      />

      {showForm && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={book}>
          <h3 style={{ marginBottom: 16 }}>Planifier un rendez-vous</h3>
          {user?.role !== 'patient' && (
            <>
              <label>Patient *</label>
              <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">— Sélectionner —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
            </>
          )}
          <label>Médecin *</label>
          <select className="input" value={form.medecin_id} onChange={(e) => setForm({ ...form, medecin_id: e.target.value })} required>
            <option value="">— Sélectionner —</option>
            {medecins.map((m) => (
              <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom}{m.specialite ? ` — ${m.specialite}` : ''}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label>Date *</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label>Heure *</label>
              <input className="input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>
          {checkingSlot && <p className="form-hint" style={{ marginTop: 8 }}>Vérification des créneaux...</p>}
          {slotConflict && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
              {slotConflict}
            </div>
          )}
          <label>Motif</label>
          <input className="input" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Ex: Contrôle, fièvre..." />
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Confirmer le RDV</button>
        </form>
      )}

      <PaymentModal
        open={!!payment}
        onClose={() => setPayment(null)}
        referenceType={payment?.referenceType}
        referenceId={payment?.referenceId || lastRdvId}
        montant={payment?.montant || RDV_PRIX}
        onSuccess={() => { setPayment(null); load(); }}
      />

      <div className="rdv-layout">
        <div>
          {loading ? (
            <div className="card rdv-empty">Chargement...</div>
          ) : rdvs.length === 0 ? (
            <div className="card rdv-empty">
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>📅</p>
              <p>Aucun rendez-vous {isStaff ? "aujourd'hui" : ''}</p>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.hour} className="rdv-hour-group">
                <div className="rdv-hour-label">
                  <span className="time-badge">{g.label}</span>
                  <span>{g.items.length} RDV</span>
                </div>
                {g.items.map((r) => {
                  const d = new Date(r.date_heure);
                  return (
                    <div key={r.id} className="rdv-card">
                      <div className="rdv-card-time">
                        <div className="hour">{formatTime(r.date_heure)}</div>
                        <div className="min">{formatDateShort(r.date_heure)}</div>
                      </div>
                      <div className="rdv-card-body">
                        <strong>{r.patient_prenom} {r.patient_nom}</strong>
                        <div className="rdv-card-meta">
                          Dr. {r.medecin_prenom} {r.medecin_nom}
                          {r.motif && ` · ${r.motif}`}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Badge status={r.statut} label={STATUT_FR[r.statut]} />
                          {r.paye && <span style={{ marginLeft: 8, fontSize: 12 }}>✅ Payé</span>}
                          {r.sms_rappel_envoye && <span style={{ marginLeft: 8, fontSize: 12 }}>📱 SMS</span>}
                        </div>
                      </div>
                      <div className="rdv-card-actions">
                        {!r.paye && user?.role === 'patient' && (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setPayment({ referenceType: 'rendez_vous', referenceId: r.id, montant: RDV_PRIX })}>💳</button>
                        )}
                        {isStaff && !r.sms_rappel_envoye && (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => sendSms(r.id)}>📱 SMS</button>
                        )}
                        {isStaff && r.statut !== 'annule' && r.statut !== 'termine' && (
                          <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }} onClick={() => cancelRdv(r.id)}>Annuler</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <aside className="card rdv-sidebar-card">
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Résumé du jour</h3>
          <div className="rdv-summary-item"><span>Total RDV</span><strong>{rdvs.length}</strong></div>
          <div className="rdv-summary-item"><span>À venir</span><strong>{upcoming}</strong></div>
          <div className="rdv-summary-item"><span>Passés</span><strong>{past}</strong></div>
          <div className="rdv-summary-item"><span>Tarif consultation</span><strong>{formatFcfa(RDV_PRIX)}</strong></div>
          <p className="nc-hint" style={{ marginTop: 16, fontSize: 12 }}>
            📱 SMS rappel simulé à la création. Heure affichée en format 24h.
          </p>
        </aside>
      </div>
    </div>
  );
}
