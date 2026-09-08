import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Button, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function TicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getTickets();
      setTickets(res.data);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const buyTicket = async () => {
    try {
      const res = await api.buyTicket({ service: 'Consultation générale', prix: 5000 });
      Alert.alert('Ticket acheté', `Numéro: ${res.data.numero}`);
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <AppHeader title="Mes Tickets" navigation={navigation} />
      <FlatList
        data={tickets}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={`Ticket ${item.numero}`}
            subtitle={`${item.service} — ${item.prix} FCFA`}
            status={item.statut}
          />
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={buyTicket} label="Acheter ticket" color="#fff" />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 80 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2563EB' },
});
