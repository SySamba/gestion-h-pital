import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function QueueScreen({ navigation }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getQueue();
      setQueue(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const next = async (id) => {
    try {
      await api.updateTicket(id, 'en_cours');
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const done = async (id) => {
    try {
      await api.updateTicket(id, 'termine');
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <AppHeader title="File d'attente" navigation={navigation} />
      <Text style={styles.header}>{queue.length} patient(s) en attente</Text>
      <FlatList
        data={queue}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item, index }) => (
          <InfoCard
            title={`#${index + 1} — ${item.numero}`}
            subtitle={`${item.prenom} ${item.nom} — ${item.service}`}
            status={item.statut}
          >
            <Button compact onPress={() => next(item.id)} style={{ marginTop: 4 }}>Appeler</Button>
            <Button compact onPress={() => done(item.id)}>Terminer</Button>
          </InfoCard>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { textAlign: 'center', fontSize: 16, fontWeight: '600', padding: 12, color: '#2563EB' },
});
