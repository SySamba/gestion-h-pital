import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function VentesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getVentes();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="Historique ventes" navigation={navigation} />
      <FlatList
        data={items}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={item.medicament_nom}
            subtitle={`${item.quantite} unités — ${item.prix_total} FCFA`}
          >
            <Text style={{ fontSize: 12, color: '#64748B' }}>
              {new Date(item.date_vente).toLocaleString('fr-FR')}
            </Text>
          </InfoCard>
        )}
      />
    </>
  );
}
