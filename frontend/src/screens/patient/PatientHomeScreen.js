import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import MenuButton from '../../components/MenuButton';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { colors } from '../../constants/theme';

export default function PatientHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tickets: 0, rdv: 0, analyses: 0 });

  const load = async () => {
    try {
      const [t, r, a] = await Promise.all([
        api.getTickets(),
        api.getRdv(),
        api.getAnalyses(),
      ]);
      setStats({
        tickets: t.data?.length || 0,
        rdv: r.data?.filter((x) => x.statut !== 'annule').length || 0,
        analyses: a.data?.filter((x) => x.statut === 'termine').length || 0,
      });
    } catch (_) {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="MedikaSN" navigation={navigation} showNotif />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <View style={styles.welcome}>
          <Avatar.Text size={56} label={`${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`} style={{ backgroundColor: colors.primary }} />
          <View style={styles.welcomeText}>
            <Text style={styles.hello}>Bonjour,</Text>
            <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
            <Text style={styles.sub}>Votre espace santé — Dakar</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Tickets" value={stats.tickets} color={colors.primary} />
          <StatCard label="RDV" value={stats.rdv} color={colors.success} />
          <StatCard label="Analyses" value={stats.analyses} color={colors.warning} />
        </View>

        <Text style={styles.section}>Services</Text>
        <View style={styles.grid}>
          <MenuButton icon="🎫" label="Mes Tickets" onPress={() => navigation.navigate('Tickets')} />
          <MenuButton icon="📅" label="Rendez-vous" onPress={() => navigation.navigate('RendezVous')} color={colors.success} />
          <MenuButton icon="🧪" label="Mes Analyses" onPress={() => navigation.navigate('Analyses')} color="#8B5CF6" />
          <MenuButton icon="💊" label="Ordonnances" onPress={() => navigation.navigate('Ordonnances')} color={colors.warning} />
          <MenuButton icon="📋" label="Dossier médical" onPress={() => navigation.navigate('Profil')} color="#EC4899" />
          <MenuButton icon="📱" label="Mon QR Code" onPress={() => navigation.navigate('QRCode')} color="#06B6D4" />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  welcome: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: colors.surface, padding: 18, borderRadius: 16, elevation: 2 },
  welcomeText: { marginLeft: 16, flex: 1 },
  hello: { fontSize: 14, color: colors.textSecondary },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.success, marginTop: 4, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
