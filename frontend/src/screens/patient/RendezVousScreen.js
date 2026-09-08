import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, Alert, RefreshControl, View } from 'react-native';
import { FAB, Portal, Modal, TextInput, Button, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';

export default function RendezVousScreen({ navigation }) {
  const [rdv, setRdv] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ medecin_id: '1', date_heure: '', motif: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, m] = await Promise.all([api.getRdv(), api.getMedecins()]);
      setRdv(r.data);
      setMedecins(m.data);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const book = async () => {
    try {
      await api.createRdv({
        medecin_id: parseInt(form.medecin_id, 10),
        date_heure: form.date_heure,
        motif: form.motif,
      });
      setVisible(false);
      Alert.alert('Succès', 'Rendez-vous planifié');
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
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard
            title={`Dr. ${item.medecin_prenom} ${item.medecin_nom}`}
            subtitle={new Date(item.date_heure).toLocaleString('fr-FR')}
            status={item.statut}
          />
        )}
      />
      <FAB icon="calendar-plus" style={styles.fab} onPress={() => setVisible(true)} color="#fff" />
      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Nouveau rendez-vous</Text>
          <TextInput label="ID Médecin" value={form.medecin_id} onChangeText={(v) => setForm({ ...form, medecin_id: v })} mode="outlined" style={styles.input} />
          <TextInput label="Date/heure (YYYY-MM-DD HH:MM:SS)" value={form.date_heure} onChangeText={(v) => setForm({ ...form, date_heure: v })} mode="outlined" style={styles.input} placeholder="2026-05-25 10:00:00" />
          <TextInput label="Motif" value={form.motif} onChangeText={(v) => setForm({ ...form, motif: v })} mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={book} buttonColor="#2563EB">Confirmer</Button>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 80 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2563EB' },
  modal: { backgroundColor: '#fff', margin: 24, padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { marginBottom: 10 },
});
