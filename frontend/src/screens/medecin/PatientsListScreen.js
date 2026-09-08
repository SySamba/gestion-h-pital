import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function PatientsListScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getPatients();
      setPatients(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="Patients" navigation={navigation} />
      <FlatList
        data={patients}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={`${item.prenom} ${item.nom}`}
            subtitle={`${item.telephone || item.email} — Appuyez pour consulter`}
            onPress={() =>
              navigation.navigate('Consultation', {
                patientId: item.id,
                patientName: `${item.prenom} ${item.nom}`,
              })
            }
          />
        )}
      />
    </>
  );
}
