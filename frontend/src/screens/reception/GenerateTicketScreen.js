import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';

export default function GenerateTicketScreen({ navigation }) {
  const [patientId, setPatientId] = useState('1');
  const [service, setService] = useState('Consultation générale');

  const generate = async () => {
    try {
      const res = await api.generateTicket({ patient_id: parseInt(patientId, 10), service });
      Alert.alert('Ticket généré', `Numéro: ${res.data.numero}`);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <AppHeader title="Générer ticket" navigation={navigation} />
      <TextInput label="ID Patient" value={patientId} onChangeText={setPatientId} mode="outlined" style={styles.input} />
      <TextInput label="Service" value={service} onChangeText={setService} mode="outlined" style={styles.input} />
      <Button mode="contained" onPress={generate} buttonColor="#2563EB" style={styles.btn}>
        Générer
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  input: { margin: 16 },
  btn: { margin: 16, borderRadius: 8 },
});
