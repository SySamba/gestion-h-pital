import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function ReceptionRDVScreen({ navigation }) {
  const [rdv, setRdv] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getRdvToday();
      setRdv(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="RDV du jour" navigation={navigation} />
      <FlatList
        data={rdv}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={`${item.patient_prenom} ${item.patient_nom}`}
            subtitle={new Date(item.date_heure).toLocaleString('fr-FR')}
            status={item.statut}
          />
        )}
      />
    </>
  );
}
