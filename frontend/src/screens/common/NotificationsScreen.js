import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, List, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getNotifications();
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const markRead = async (id) => {
    await api.markNotificationRead(id);
    load();
  };

  return (
    <>
      <AppHeader title="Notifications" navigation={navigation} />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucune notification</Text>}
        renderItem={({ item }) => (
          <List.Item
            title={item.titre}
            description={item.message}
            left={() => <List.Icon icon={item.lu ? 'email-open' : 'email'} color={item.lu ? '#94A3B8' : '#2563EB'} />}
            right={() => !item.lu && <IconButton icon="check" onPress={() => markRead(item.id)} />}
            style={[styles.item, !item.lu && styles.unread]}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 8 },
  item: { backgroundColor: '#fff', marginVertical: 4, borderRadius: 8 },
  unread: { borderLeftWidth: 3, borderLeftColor: '#2563EB' },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748B' },
});
