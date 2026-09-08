import React from 'react';
import { Card, Text, Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';

const statusColors = {
  en_attente: '#F59E0B',
  en_cours: '#2563EB',
  termine: '#10B981',
  annule: '#EF4444',
  planifie: '#2563EB',
  confirme: '#10B981',
  demande: '#F59E0B',
  active: '#2563EB',
  delivree: '#10B981',
};

export default function InfoCard({ title, subtitle, status, onPress, children }) {
  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {status && (
          <Chip style={[styles.chip, { backgroundColor: statusColors[status] + '22' }]} textStyle={{ color: statusColors[status] || '#64748B', fontSize: 11 }}>
            {status.replace('_', ' ')}
          </Chip>
        )}
        {children}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 6, borderRadius: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  chip: { alignSelf: 'flex-start', marginTop: 8, height: 26 },
});
