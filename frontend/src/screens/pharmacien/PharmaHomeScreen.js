import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MenuButton from '../../components/MenuButton';

export default function PharmaHomeScreen({ navigation }) {
  return (
    <>
      <AppHeader title="Pharmacie" navigation={navigation} showNotif />
      <ScrollView style={styles.container}>
        <MenuButton icon="💊" label="Stock médicaments" onPress={() => navigation.navigate('Stock')} />
        <MenuButton icon="📋" label="Ordonnances" onPress={() => navigation.navigate('OrdonnancesPharma')} color="#10B981" />
        <MenuButton icon="💰" label="Ventes" onPress={() => navigation.navigate('Ventes')} color="#F59E0B" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16, flexDirection: 'row', flexWrap: 'wrap' },
});
