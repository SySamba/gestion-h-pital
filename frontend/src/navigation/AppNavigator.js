import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import TicketsScreen from '../screens/patient/TicketsScreen';
import RendezVousScreen from '../screens/patient/RendezVousScreen';
import AnalysesScreen from '../screens/patient/AnalysesScreen';
import OrdonnancesScreen from '../screens/patient/OrdonnancesScreen';
import ProfilScreen from '../screens/patient/ProfilScreen';
import QRCodeScreen from '../screens/patient/QRCodeScreen';

import MedecinHomeScreen from '../screens/medecin/MedecinHomeScreen';
import MedecinRDVScreen from '../screens/medecin/MedecinRDVScreen';
import PatientsListScreen from '../screens/medecin/PatientsListScreen';
import ConsultationScreen from '../screens/medecin/ConsultationScreen';

import LaboHomeScreen from '../screens/laborantin/LaboHomeScreen';

import PharmaHomeScreen from '../screens/pharmacien/PharmaHomeScreen';
import StockScreen from '../screens/pharmacien/StockScreen';
import VentesScreen from '../screens/pharmacien/VentesScreen';
import OrdonnancesPharmaScreen from '../screens/pharmacien/OrdonnancesPharmaScreen';

import ReceptionHomeScreen from '../screens/reception/ReceptionHomeScreen';
import RegisterPatientScreen from '../screens/reception/RegisterPatientScreen';
import QueueScreen from '../screens/reception/QueueScreen';
import GenerateTicketScreen from '../screens/reception/GenerateTicketScreen';
import ReceptionRDVScreen from '../screens/reception/ReceptionRDVScreen';

import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';
import UsersScreen from '../screens/admin/UsersScreen';

const Stack = createNativeStackNavigator();

const commonScreens = (StackNav) => (
  <>
    <StackNav.Screen name="Notifications" component={NotificationsScreen} />
    <StackNav.Screen name="Queue" component={QueueScreen} />
    <StackNav.Screen name="Dashboard" component={DashboardScreen} />
  </>
);

function PatientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={PatientHomeScreen} />
      <Stack.Screen name="Tickets" component={TicketsScreen} />
      <Stack.Screen name="RendezVous" component={RendezVousScreen} />
      <Stack.Screen name="Analyses" component={AnalysesScreen} />
      <Stack.Screen name="Ordonnances" component={OrdonnancesScreen} />
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} />
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
}

function MedecinStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MedecinHomeScreen} />
      <Stack.Screen name="MedecinRDV" component={MedecinRDVScreen} />
      <Stack.Screen name="Patients" component={PatientsListScreen} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} />
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
}

function LaboStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={LaboHomeScreen} />
      <Stack.Screen name="Analyses" component={AnalysesScreen} />
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
}

function PharmaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={PharmaHomeScreen} />
      <Stack.Screen name="Stock" component={StockScreen} />
      <Stack.Screen name="Ventes" component={VentesScreen} />
      <Stack.Screen name="OrdonnancesPharma" component={OrdonnancesPharmaScreen} />
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
}

function ReceptionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={ReceptionHomeScreen} />
      <Stack.Screen name="RegisterPatient" component={RegisterPatientScreen} />
      <Stack.Screen name="GenerateTicket" component={GenerateTicketScreen} />
      <Stack.Screen name="ReceptionRDV" component={ReceptionRDVScreen} />
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={AdminHomeScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="Patients" component={PatientsListScreen} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} />
      <Stack.Screen name="Analyses" component={AnalysesScreen} />
      <Stack.Screen name="Stock" component={StockScreen} />
      <Stack.Screen name="RegisterPatient" component={RegisterPatientScreen} />
      <Stack.Screen name="GenerateTicket" component={GenerateTicketScreen} />
      <Stack.Screen name="ReceptionRDV" component={ReceptionRDVScreen} />
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
}

const roleStacks = {
  patient: PatientStack,
  medecin: MedecinStack,
  laborantin: LaboStack,
  pharmacien: PharmaStack,
  receptionniste: ReceptionStack,
  admin: AdminStack,
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const RoleStack = user ? roleStacks[user.role] || PatientStack : null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={RoleStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
