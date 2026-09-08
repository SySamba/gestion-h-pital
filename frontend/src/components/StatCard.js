import React from 'react';
import { Card, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export default function StatCard({ label, value, color = '#2563EB' }) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', margin: 4, borderRadius: 12 },
  value: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 12, color: '#64748B', marginTop: 4 },
});
