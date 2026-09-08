import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import InfoCard from '../../components/InfoCard';
import { api } from '../../services/api';
import { ROLE_LABELS } from '../../constants/config';

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <>
      <AppHeader title="Utilisateurs" navigation={navigation} />
      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <InfoCard title={`${item.prenom} ${item.nom}`} subtitle={item.email}>
            <Chip style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              {ROLE_LABELS[item.role] || item.role}
            </Chip>
          </InfoCard>
        )}
      />
    </>
  );
}
