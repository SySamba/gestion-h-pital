import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import StatCard from '../../components/StatCard';
import { api } from '../../services/api';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getDashboard();
      setStats(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (!stats) return <AppHeader title="Dashboard" navigation={navigation} />;

  return (
    <>
      <AppHeader title="Dashboard" navigation={navigation} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.row}>
          <StatCard label="Patients" value={stats.patients} />
          <StatCard label="RDV aujourd'hui" value={stats.rendez_vous_aujourdhui} color="#10B981" />
        </View>
        <View style={styles.row}>
          <StatCard label="Analyses en attente" value={stats.analyses_en_attente} color="#F59E0B" />
          <StatCard label="Tickets aujourd'hui" value={stats.tickets_aujourdhui} color="#8B5CF6" />
        </View>
        <View style={styles.row}>
          <StatCard label="Médicaments dispo" value={stats.medicaments_disponibles} color="#06B6D4" />
          <StatCard label="Alertes stock" value={stats.alertes_stock} color="#EF4444" />
        </View>
        <View style={styles.row}>
          <StatCard
            label="Revenus du jour"
            value={`${stats.revenus_journaliers?.toLocaleString()} F`}
            color="#10B981"
          />
          <StatCard label="Utilisateurs actifs" value={stats.utilisateurs_actifs} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
