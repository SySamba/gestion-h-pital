import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';

export default function QRCodeScreen({ navigation }) {
  const [qr, setQr] = useState('');

  useEffect(() => {
    api.getMyProfile().then((res) => setQr(res.data.patient?.qr_code || ''));
  }, []);

  return (
    <>
      <AppHeader title="Mon QR Code" navigation={navigation} />
      <View style={styles.container}>
        {qr ? (
          <>
            <QRCode value={qr} size={200} color="#2563EB" backgroundColor="#fff" />
            <Text style={styles.code}>{qr}</Text>
            <Text style={styles.hint}>Présentez ce code à l'accueil</Text>
          </>
        ) : (
          <Text>Chargement...</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  code: { marginTop: 20, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  hint: { marginTop: 8, fontSize: 13, color: '#64748B' },
});
