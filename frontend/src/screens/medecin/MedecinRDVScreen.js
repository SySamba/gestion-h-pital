import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function MedecinRDVScreen({ navigation }) {
  const [rdv, setRdv] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getRdv();
      setRdv(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const updateStatus = async (id, statut) => {
    try {
      await api.updateRdv(id, { statut });
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <AppHeader title="Rendez-vous" navigation={navigation} />
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
          >
            {item.statut === 'planifie' && (
              <Button compact mode="contained" onPress={() => updateStatus(item.id, 'confirme')} style={{ marginTop: 8 }}>
                Confirmer
              </Button>
            )}
          </InfoCard>
        )}
      />
    </>
  );
}
