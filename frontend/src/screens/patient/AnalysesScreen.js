import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function AnalysesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getAnalyses();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="Mes Analyses" navigation={navigation} />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={item.type_analyse}
            subtitle={item.resultat_texte || (item.resultat_url ? 'PDF disponible' : 'En attente')}
            status={item.statut}
          />
        )}
      />
    </>
  );
}
