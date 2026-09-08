import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function StockScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getMedicaments();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="Stock" navigation={navigation} />
      <FlatList
        data={items}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard title={item.nom} subtitle={`${item.prix} FCFA — Stock: ${item.stock}`}>
            {item.alerte_stock && <Chip icon="alert" style={{ marginTop: 8 }}>Stock bas</Chip>}
          </InfoCard>
        )}
      />
    </>
  );
}
