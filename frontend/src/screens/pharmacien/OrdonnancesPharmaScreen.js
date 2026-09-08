import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function OrdonnancesPharmaScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [o, m] = await Promise.all([api.getOrdonnances(), api.getMedicaments()]);
      setItems(o.data.filter((x) => x.statut === 'active'));
      setMeds(m.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const delivrer = async (ordonnance) => {
    const med = meds[0];
    if (!med) return Alert.alert('Erreur', 'Aucun médicament en stock');
    try {
      await api.createVente({
        ordonnance_id: ordonnance.id,
        medicament_id: med.id,
        quantite: 1,
      });
      Alert.alert('Succès', 'Médicament délivré');
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <AppHeader title="Ordonnances à délivrer" navigation={navigation} />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={`${item.patient_prenom} ${item.patient_nom}`}
            subtitle={`Ordonnance #${item.id}`}
            status={item.statut}
          >
            <Button compact mode="contained" onPress={() => delivrer(item)} style={{ marginTop: 8 }} buttonColor="#10B981">
              Délivrer
            </Button>
          </InfoCard>
        )}
      />
    </>
  );
}
