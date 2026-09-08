import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MenuButton from '../../components/MenuButton';

export default function ReceptionHomeScreen({ navigation }) {
  return (
    <>
      <AppHeader title="Réception" navigation={navigation} showNotif />
      <ScrollView style={styles.container}>
        <MenuButton icon="👤" label="Enregistrer patient" onPress={() => navigation.navigate('RegisterPatient')} />
        <MenuButton icon="🎫" label="Générer ticket" onPress={() => navigation.navigate('GenerateTicket')} color="#10B981" />
        <MenuButton icon="📋" label="File d'attente" onPress={() => navigation.navigate('Queue')} color="#F59E0B" />
        <MenuButton icon="📅" label="Rendez-vous" onPress={() => navigation.navigate('ReceptionRDV')} color="#8B5CF6" />
        <MenuButton icon="📊" label="Statistiques" onPress={() => navigation.navigate('Dashboard')} color="#06B6D4" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16, flexDirection: 'row', flexWrap: 'wrap' },
});
