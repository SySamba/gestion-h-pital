import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';

export default function ProfilScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getMyProfile();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const p = data?.patient;

  return (
    <>
      <AppHeader title="Dossier médical" navigation={navigation} />
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        {p && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>{p.prenom} {p.nom}</Text>
              <Text style={styles.info}>Email: {p.email}</Text>
              <Text style={styles.info}>Téléphone: {p.telephone || '—'}</Text>
              <Text style={styles.info}>Groupe sanguin: {p.groupe_sanguin || '—'}</Text>
              <Text style={styles.info}>Allergies: {p.allergies || 'Aucune'}</Text>
              <Text style={styles.info}>QR: {p.qr_code}</Text>
            </Card.Content>
          </Card>
        )}
        <Text style={styles.section}>Historique médical</Text>
        {(data?.historique || []).map((h) => (
          <Card key={h.id} style={styles.card}>
            <Card.Content>
              <Text style={styles.date}>{new Date(h.date_consultation).toLocaleDateString('fr-FR')}</Text>
              <Text style={styles.diag}>{h.diagnostic}</Text>
              {h.notes && <Text style={styles.notes}>{h.notes}</Text>}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16 },
  card: { marginBottom: 10, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  info: { fontSize: 14, color: '#64748B', marginTop: 6 },
  section: { fontSize: 16, fontWeight: '600', marginVertical: 12, color: '#1E293B' },
  date: { fontSize: 12, color: '#2563EB' },
  diag: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  notes: { fontSize: 13, color: '#64748B', marginTop: 4 },
});
