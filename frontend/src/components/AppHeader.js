import React from 'react';
import { Appbar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function AppHeader({ title, navigation, showNotif }) {
  const { logout } = useAuth();
  return (
    <Appbar.Header elevated style={{ backgroundColor: '#1E40AF' }}>
      <Appbar.Content title={title} titleStyle={{ color: '#fff', fontWeight: '700' }} />
      {showNotif && (
        <Appbar.Action icon="bell" color="#fff" onPress={() => navigation.navigate('Notifications')} />
      )}
      <Appbar.Action icon="logout" color="#fff" onPress={logout} />
    </Appbar.Header>
  );
}
