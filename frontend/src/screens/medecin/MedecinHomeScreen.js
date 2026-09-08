import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MenuButton from '../../components/MenuButton';

export default function MedecinHomeScreen({ navigation }) {
  return (
    <>
      <AppHeader title="Espace Médecin" navigation={navigation} showNotif />
      <ScrollView style={styles.container}>
        <MenuButton icon="📅" label="Rendez-vous" onPress={() => navigation.navigate('MedecinRDV')} />
        <MenuButton icon="👥" label="Patients" onPress={() => navigation.navigate('Patients')} color="#10B981" />
        <MenuButton icon="🩺" label="Consultation" onPress={() => navigation.navigate('Consultation')} color="#8B5CF6" />
        <MenuButton icon="🧪" label="Demander analyse" onPress={() => navigation.navigate('Consultation')} color="#F59E0B" />
        <MenuButton icon="💊" label="Prescrire" onPress={() => navigation.navigate('Consultation')} color="#EC4899" />
        <MenuButton icon="🎫" label="File d'attente" onPress={() => navigation.navigate('Queue')} color="#06B6D4" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16, flexDirection: 'row', flexWrap: 'wrap' },
});
