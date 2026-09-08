import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', telephone: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register({ ...form, role: 'patient' });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Créer un compte</Text>
      {['prenom', 'nom', 'email', 'telephone', 'password'].map((field) => (
        <TextInput
          key={field}
          label={field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field]}
          onChangeText={(v) => set(field, v)}
          mode="outlined"
          style={styles.input}
          secureTextEntry={field === 'password'}
          keyboardType={field === 'email' ? 'email-address' : field === 'telephone' ? 'phone-pad' : 'default'}
        />
      ))}
      <Button mode="contained" onPress={handleRegister} loading={loading} buttonColor="#2563EB" style={styles.btn}>
        S'inscrire
      </Button>
      <Button mode="text" onPress={() => navigation.goBack()}>Retour</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 24, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, color: '#1E293B' },
  input: { marginBottom: 10 },
  btn: { marginVertical: 16, borderRadius: 8 },
});
