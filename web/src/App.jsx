import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RoleHome = lazy(() => import('./pages/RoleHome'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Queue = lazy(() => import('./pages/Queue'));
const RendezVous = lazy(() => import('./pages/RendezVous'));
const Ordonnances = lazy(() => import('./pages/Ordonnances'));
const Patients = lazy(() => import('./pages/Patients'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const Consultation = lazy(() => import('./pages/Consultation'));
const RegisterPatient = lazy(() => import('./pages/RegisterPatient'));
const Administration = lazy(() => import('./pages/Administration'));
const Profil = lazy(() => import('./pages/Profil'));
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Analyses = lazy(() => import('./pages/Analyses'));
const MyQueue = lazy(() => import('./pages/MyQueue'));
const QueueDisplay = lazy(() => import('./pages/QueueDisplay'));
const Etablissements = lazy(() => import('./pages/Etablissements'));
const UrgenceAlerts = lazy(() => import('./pages/UrgenceAlerts'));
const NouvelleConsultation = lazy(() => import('./pages/NouvelleConsultation'));
const Stock = lazy(() => import('./pages/Stock'));
const Ventes = lazy(() => import('./pages/Ventes'));
const Caisse = lazy(() => import('./pages/Caisse'));
const Certificats = lazy(() => import('./pages/Certificats'));
const Hospitalisation = lazy(() => import('./pages/Hospitalisation'));
const Assurances = lazy(() => import('./pages/Assurances'));

function LoadingScreen({ label = 'Chargement de MedikaSN...' }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeByRole() {
  return <RoleHome />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/ecran-attente" element={<QueueDisplay />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeByRole />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="file-attente" element={<Queue />} />
        <Route path="urgence" element={<UrgenceAlerts />} />
        <Route path="ma-file" element={<MyQueue />} />
        <Route path="ecran-attente" element={<QueueDisplay />} />
        <Route path="etablissements" element={<Etablissements />} />
        <Route path="rendez-vous" element={<RendezVous />} />
        <Route path="analyses" element={<Analyses />} />
        <Route path="ordonnances" element={<Ordonnances />} />
        <Route path="stock" element={<Stock />} />
        <Route path="ventes" element={<Ventes />} />
        <Route path="caisse" element={<Caisse />} />
        <Route path="certificats" element={<Certificats />} />
        <Route path="hospitalisation" element={<Hospitalisation />} />
        <Route path="assurances" element={<Assurances />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="consultation/:id" element={<Consultation />} />
        <Route path="patients-nouveau" element={<RegisterPatient />} />
        <Route path="nouvelle-consultation" element={<NouvelleConsultation />} />
        <Route path="administration" element={<Administration />} />
        <Route path="profil" element={<Profil />} />
        <Route path="utilisateurs" element={<Users />} />
        <Route path="rapports" element={<Reports />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
