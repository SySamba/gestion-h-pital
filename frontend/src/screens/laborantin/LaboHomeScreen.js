import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MenuButton from '../../components/MenuButton';
import { colors } from '../../constants/theme';

export default function LaboHomeScreen({ navigation }) {
  return (
    <>
      <AppHeader title="Laboratoire" navigation={navigation} showNotif />
      <ScrollView style={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🧪 Espace Laboratoire</Text>
          <Text style={styles.bannerText}>Validez les analyses et saisissez les résultats</Text>
        </View>
        <MenuButton icon="🧪" label="Analyses en attente" onPress={() => navigation.navigate('Analyses')} color="#8B5CF6" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  banner: { backgroundColor: colors.surface, padding: 20, borderRadius: 14, marginBottom: 20 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  bannerText: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
});
