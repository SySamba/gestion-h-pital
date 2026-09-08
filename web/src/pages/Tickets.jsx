import React, { useState, useEffect } from 'react';

import { api } from '../api/api';

import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

import DataTable, { Badge } from './DataTable';

import PageHeader from '../components/PageHeader';

import PaymentModal from '../components/PaymentModal';

import { STATUT_FR, PRIORITE_FR, formatFcfa, formatDateTime } from '../utils/labels';

import { canReception, isAdmin } from '../utils/permissions';



export default function Tickets() {

  const { user } = useAuth();

  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);

  const [patientId, setPatientId] = useState('1');

  const [service, setService] = useState('Consultation générale');

  const [priorite, setPriorite] = useState('normale');

  const [reloadKey, setReloadKey] = useState(0);

  const [payment, setPayment] = useState(null);

  const [patients, setPatients] = useState([]);



  const isPatient = user?.role === 'patient';

  const canGenerate = canReception(user?.role) || isAdmin(user?.role);

  useEffect(() => {
    if (canGenerate) api.getPatients().then((r) => setPatients(r.data || [])).catch(() => {});
  }, [canGenerate]);



  const buy = async () => {

    try {

      const res = await api.buyTicket({ service: 'Consultation générale', prix: 5000, priorite: 'normale' });

      toast(`Ticket ${res.data.numero} créé`);

      setPayment({ referenceType: 'ticket', referenceId: res.data.id, montant: 5000 });

      setReloadKey((k) => k + 1);

    } catch (e) {

      toast(e.message, 'error');

    }

  };



  const generate = async (e) => {

    e.preventDefault();

    try {

      const res = await api.generateTicket({

        patient_id: parseInt(patientId, 10),

        service,

        prix: 5000,

        priorite,

      });

      toast(`Ticket ${res.data.numero} généré`);

      setShowModal(false);

      setReloadKey((k) => k + 1);

    } catch (err) {

      toast(err.message, 'error');

    }

  };



  const openPay = (row) => {

    if (row.paye) {

      toast('Ticket déjà payé', 'info');

      return;

    }

    setPayment({ referenceType: 'ticket', referenceId: row.id, montant: row.prix || 5000 });

  };



  return (

    <div>

      <PageHeader

        title="Tickets de consultation"

        subtitle={isPatient ? 'Achetez, payez et suivez votre position' : 'Gestion des tickets patients'}

        action={

          isPatient ? (

            <button type="button" className="btn btn-primary" onClick={buy}>+ Acheter un ticket</button>

          ) : canGenerate ? (

            <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Générer un ticket</button>

          ) : null

        }

      />



      {isPatient && (

        <div className="card" style={{ marginBottom: 24, background: '#eff6ff' }}>

          <p>💡 Après achat, payez via <strong>Wave</strong>, <strong>Orange Money</strong> ou <strong>Free Money</strong> (simulation), puis suivez votre position dans <a href="/app/ma-file">Ma file d'attente</a>.</p>

        </div>

      )}



      {showModal && (

        <div className="modal-overlay">

          <div className="modal card">

            <h3>Générer un ticket</h3>

            <label>Patient</label>

            <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
              ))}
            </select>

            <label>Service</label>

            <input className="input" value={service} onChange={(e) => setService(e.target.value)} />

            <label>Triage (urgence)</label>

            <select className="input" value={priorite} onChange={(e) => setPriorite(e.target.value)}>

              {Object.entries(PRIORITE_FR).map(([k, v]) => (

                <option key={k} value={k}>{v}</option>

              ))}

            </select>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>

              <button type="submit" className="btn btn-primary" onClick={generate}>Générer</button>

              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>

            </div>

          </div>

        </div>

      )}



      <PaymentModal

        open={!!payment}

        onClose={() => setPayment(null)}

        referenceType={payment?.referenceType}

        referenceId={payment?.referenceId}

        montant={payment?.montant}

        onSuccess={() => { setPayment(null); setReloadKey((k) => k + 1); }}

      />



      <DataTable

        key={reloadKey}

        title=""

        fetchFn={api.getTickets}

        columns={[

          { key: 'numero', label: 'N° Ticket' },

          { key: 'patient', label: 'Patient', render: (r) => `${r.prenom || ''} ${r.nom || ''}`.trim() || '—' },

          { key: 'service', label: 'Service' },

          { key: 'priorite', label: 'Triage', render: (r) => PRIORITE_FR[r.priorite || 'normale'] },

          { key: 'prix', label: 'Prix', render: (r) => formatFcfa(r.prix) },

          { key: 'paye', label: 'Paiement', render: (r) => r.paye ? '✅ Payé' : (

            <button type="button" className="btn btn-outline btn-sm" onClick={() => openPay(r)}>💳 Payer</button>

          )},

          { key: 'statut', label: 'Statut', render: (r) => <Badge status={r.statut} label={STATUT_FR[r.statut]} /> },

          { key: 'date', label: 'Date', render: (r) => formatDateTime(r.created_at) },

        ]}

      />

    </div>

  );

}

