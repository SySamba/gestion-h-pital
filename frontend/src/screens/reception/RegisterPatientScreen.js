import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';

export default function RegisterPatientScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '', password: 'password123', nom: '', prenom: '', telephone: '', date_naissance: '', sexe: 'F', allergies: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    try {
      const res = await api.registerPatient(form);
      Alert.alert('Succès', `Patient enregistré. QR: ${res.data.qrCode}`);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <AppHeader title="Enregistrer patient" navigation={navigation} />
      <ScrollView style={styles.container}>
        {['prenom', 'nom', 'email', 'telephone', 'date_naissance', 'allergies'].map((f) => (
          <TextInput key={f} label={f} value={form[f]} onChangeText={(v) => set(f, v)} mode="outlined" style={styles.input} />
        ))}
        <Button mode="contained" onPress={submit} buttonColor="#2563EB" style={styles.btn}>
          Enregistrer
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16 },
  input: { marginBottom: 10 },
  btn: { marginTop: 16, borderRadius: 8 },
});
