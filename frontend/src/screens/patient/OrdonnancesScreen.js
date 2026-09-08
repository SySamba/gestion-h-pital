import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function OrdonnancesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getOrdonnances();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="Ordonnances" navigation={navigation} />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={`Ordonnance #${item.id}`}
            subtitle={`Dr. ${item.medecin_prenom} ${item.medecin_nom} — ${new Date(item.date_creation).toLocaleDateString('fr-FR')}`}
            status={item.statut}
          >
            {(item.medicaments || []).map((m, i) => (
              <Text key={i} style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                • {m.nom} {m.dosage || ''}
              </Text>
            ))}
          </InfoCard>
        )}
      />
    </>
  );
}
