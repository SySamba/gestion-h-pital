import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Card, Chip } from 'react-native-paper';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';
import { colors } from '../../constants/theme';

const ANALYSES = ['NFS', 'Glycémie', 'TDR Paludisme', 'ECG', 'Bilan lipidique'];

export default function ConsultationScreen({ navigation, route }) {
  const patientId = route.params?.patientId;
  const patientName = route.params?.patientName || 'Patient';
  const [patient, setPatient] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [tab, setTab] = useState('diagnostic');
  const [diagnostic, setDiagnostic] = useState('');
  const [notes, setNotes] = useState('');
  const [typeAnalyse, setTypeAnalyse] = useState(ANALYSES[0]);
  const [medNom, setMedNom] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      api.getPatient(patientId)
        .then((r) => {
          setPatient(r.data.patient);
          setHistorique(r.data.historique || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, [patientId]);

  const showSuccess = (msg) => Alert.alert('Succès', msg);

  const addDiagnostic = async () => {
    if (!diagnostic.trim()) {
      Alert.alert('Attention', 'Veuillez saisir un diagnostic');
      return;
    }
    try {
      await api.addHistorique({
        patient_id: parseInt(patientId, 10),
        diagnostic: diagnostic.trim(),
        notes: notes.trim(),
      });
      showSuccess('Consultation enregistrée');
      setDiagnostic('');
      setNotes('');
      const r = await api.getPatient(patientId);
      setHistorique(r.data.historique || []);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const demanderAnalyse = async () => {
    try {
      await api.createAnalyse({ patient_id: parseInt(patientId, 10), type_analyse: typeAnalyse });
      showSuccess(`Analyse « ${typeAnalyse} » envoyée au laboratoire`);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const prescrire = async () => {
    if (!medNom.trim()) {
      Alert.alert('Attention', 'Indiquez le nom du médicament');
      return;
    }
    try {
      await api.createOrdonnance({
        patient_id: parseInt(patientId, 10),
        medicaments: [{ nom: medNom, dosage: medDosage || 'selon prescription', duree: '7 jours' }],
        instructions: 'Suivre le traitement prescrit',
      });
      showSuccess('Ordonnance créée — patient notifié');
      setMedNom('');
      setMedDosage('');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const name = patient ? `${patient.prenom} ${patient.nom}` : patientName;

  return (
    <>
      <AppHeader title="Consultation" navigation={navigation} />
      <ScrollView style={styles.container}>
        <Card style={styles.patientCard}>
          <Card.Content>
            <Text style={styles.patientName}>{name}</Text>
            {patient?.allergies && (
              <Chip icon="alert" style={styles.allergyChip} textStyle={{ fontSize: 12 }}>
                Allergie : {patient.allergies}
              </Chip>
            )}
            {patient?.groupe_sanguin && (
              <Text style={styles.info}>Groupe sanguin : {patient.groupe_sanguin}</Text>
            )}
            {patient?.qr_code && <Text style={styles.qr}>QR : {patient.qr_code}</Text>}
          </Card.Content>
        </Card>

        {historique.length > 0 && (
          <Card style={styles.historyCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Dernières consultations</Text>
              {historique.slice(0, 3).map((h) => (
                <View key={h.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {new Date(h.date_consultation).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={styles.historyDiag}>{h.diagnostic}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'diagnostic', label: 'Diagnostic' },
            { value: 'analyse', label: 'Analyse' },
            { value: 'ordonnance', label: 'Ordonnance' },
          ]}
          style={styles.tabs}
        />

        <Card style={styles.formCard}>
          <Card.Content>
            {tab === 'diagnostic' && (
              <>
                <Text style={styles.formTitle}>Enregistrer le diagnostic</Text>
                <TextInput label="Diagnostic *" value={diagnostic} onChangeText={setDiagnostic} mode="outlined" multiline style={styles.input} />
                <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline style={styles.input} />
                <Button mode="contained" onPress={addDiagnostic} buttonColor={colors.primary}>
                  Enregistrer la consultation
                </Button>
              </>
            )}
            {tab === 'analyse' && (
              <>
                <Text style={styles.formTitle}>Demander une analyse</Text>
                <Text style={styles.hint}>Choisissez le type d'analyse pour le laboratoire</Text>
                {ANALYSES.map((a) => (
                  <Chip
                    key={a}
                    selected={typeAnalyse === a}
                    onPress={() => setTypeAnalyse(a)}
                    style={styles.chip}
                  >
                    {a}
                  </Chip>
                ))}
                <Button mode="contained" onPress={demanderAnalyse} style={{ marginTop: 16 }} buttonColor={colors.primary}>
                  Envoyer au laboratoire
                </Button>
              </>
            )}
            {tab === 'ordonnance' && (
              <>
                <Text style={styles.formTitle}>Prescrire un médicament</Text>
                <TextInput label="Médicament *" value={medNom} onChangeText={setMedNom} mode="outlined" style={styles.input} />
                <TextInput label="Dosage" value={medDosage} onChangeText={setMedDosage} mode="outlined" style={styles.input} placeholder="Ex: 1 cp matin et soir" />
                <Button mode="contained" onPress={prescrire} buttonColor={colors.primary}>
                  Créer l'ordonnance
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  patientCard: { marginBottom: 12, borderRadius: 14 },
  patientName: { fontSize: 20, fontWeight: '800', color: colors.text },
  allergyChip: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#fef3c7' },
  info: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  qr: { fontSize: 11, color: colors.textSecondary, marginTop: 8, fontFamily: 'monospace' },
  historyCard: { marginBottom: 12, borderRadius: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: colors.textSecondary },
  historyItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  historyDate: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  historyDiag: { fontSize: 14, marginTop: 4 },
  tabs: { marginBottom: 12 },
  formCard: { borderRadius: 14 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  hint: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  input: { marginBottom: 12 },
  chip: { marginRight: 8, marginBottom: 8 },
});
