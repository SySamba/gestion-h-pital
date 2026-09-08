import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, BRAND } from '../../constants/theme';

const DEMO_ACCOUNTS = [
  { email: 'fatou.fall@hopital.sn', label: 'Patient' },
  { email: 'dr.ndiaye@hopital.sn', label: 'Médecin' },
  { email: 'admin@hopital.sn', label: 'Admin' },
  { email: 'reception@hopital.sn', label: 'Réception' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('fatou.fall@hopital.sn');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Surface style={styles.logo} elevation={3}>
          <Text style={styles.logoEmoji}>🏥</Text>
        </Surface>
        <Text style={styles.brand}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🇸🇳 Sénégal · Web + Mobile</Text>
        </View>
      </View>

      <Surface style={styles.formCard} elevation={2}>
        <Text style={styles.formTitle}>Connexion</Text>
        <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput label="Mot de passe" value={password} onChangeText={setPassword} mode="outlined" style={styles.input} secureTextEntry />
        <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.btn} buttonColor={colors.primary}>
          Se connecter
        </Button>
      </Surface>

      <Text style={styles.demoTitle}>Démo — password123</Text>
      <View style={styles.demoRow}>
        {DEMO_ACCOUNTS.map((a) => (
          <Button key={a.email} mode="outlined" compact onPress={() => setEmail(a.email)} style={styles.demoBtn} textColor={colors.primary}>
            {a.label}
          </Button>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 56 },
  hero: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 88, height: 88, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  logoEmoji: { fontSize: 44 },
  brand: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 16 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  badge: { marginTop: 12, backgroundColor: '#d1fae5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  formCard: { padding: 24, borderRadius: 16, backgroundColor: colors.surface },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: colors.text },
  input: { marginBottom: 12 },
  btn: { marginTop: 8, borderRadius: 10 },
  demoTitle: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 24 },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },
  demoBtn: { margin: 2 },
});
