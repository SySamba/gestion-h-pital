import React from 'react';
import { Card, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export default function MenuButton({ icon, label, onPress, color = '#2563EB' }) {
  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content style={styles.content}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', margin: '1.5%', borderRadius: 12 },
  content: { alignItems: 'center', paddingVertical: 16 },
  icon: { fontSize: 32, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E293B', textAlign: 'center' },
});
