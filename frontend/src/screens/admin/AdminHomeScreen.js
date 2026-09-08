import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MenuButton from '../../components/MenuButton';
import { colors } from '../../constants/theme';

export default function AdminHomeScreen({ navigation }) {
  return (
    <>
      <AppHeader title="MedikaSN Admin" navigation={navigation} showNotif />
      <ScrollView style={styles.container}>
        <MenuButton icon="📊" label="Dashboard" onPress={() => navigation.navigate('Dashboard')} />
        <MenuButton icon="👥" label="Patients" onPress={() => navigation.navigate('Patients')} color={colors.success} />
        <MenuButton icon="👤" label="Nouveau patient" onPress={() => navigation.navigate('RegisterPatient')} color="#8B5CF6" />
        <MenuButton icon="🎫" label="File attente" onPress={() => navigation.navigate('Queue')} color={colors.warning} />
        <MenuButton icon="📅" label="Rendez-vous" onPress={() => navigation.navigate('ReceptionRDV')} color="#06B6D4" />
        <MenuButton icon="🧪" label="Analyses" onPress={() => navigation.navigate('Analyses')} color="#EC4899" />
        <MenuButton icon="💊" label="Pharmacie" onPress={() => navigation.navigate('Stock')} color={colors.primary} />
        <MenuButton icon="👥" label="Utilisateurs" onPress={() => navigation.navigate('Users')} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, flexDirection: 'row', flexWrap: 'wrap' },
});
