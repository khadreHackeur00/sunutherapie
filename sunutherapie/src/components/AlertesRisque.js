import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from './ui';
import { apiGetAlertes, apiPrendreEnChargeAlerte } from '../services/api';
import { QUESTIONNAIRES } from '../config/evaluation';
import { colors, spacing, radius } from '../config/theme';

const dateFr = (d) => new Date(String(d).replace(' ', 'T')).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Niveau 4 : étudiants ayant signalé un risque, à recontacter par le psy.
export default function AlertesRisque() {
  const [alertes, setAlertes] = useState([]);
  const [ouverte, setOuverte] = useState(null);
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => {
    apiGetAlertes().then((r) => setAlertes(r?.data || [])).catch(() => {});
  }, []);

  useFocusEffect(charger);
  useEffect(() => {
    const t = setInterval(charger, 60000);
    return () => clearInterval(t);
  }, [charger]);

  if (alertes.length === 0) return null;

  const traiter = async (a) => {
    setEnvoi(true);
    try {
      const res = await apiPrendreEnChargeAlerte(a.id, note.trim() || null);
      if (!res?.success) throw new Error(res?.message || 'Enregistrement impossible');
      setAlertes((l) => l.filter((x) => x.id !== a.id));
      setOuverte(null);
      setNote('');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={styles.boite}>
      <View style={styles.entete}>
        <Ionicons name="alert-circle" size={22} color={colors.danger} />
        <Text style={styles.titre}>
          {alertes.length === 1 ? '1 étudiant à recontacter' : `${alertes.length} étudiants à recontacter`}
        </Text>
      </View>
      <Text style={styles.sous}>Risque signalé (question 9 du PHQ-9). Contactez-les en priorité.</Text>

      {alertes.map((a) => (
        <View key={a.id} style={styles.alerte}>
          <Text style={styles.nom}>{a.etudiant.name}</Text>
          <Text style={styles.info}>
            {a.etudiant.universite} · {QUESTIONNAIRES[a.type]?.court} {a.score}/{QUESTIONNAIRES[a.type]?.max} · {dateFr(a.created_at)}
          </Text>
          <View style={styles.contacts}>
            {a.etudiant.telephone ? (
              <TouchableOpacity style={styles.contact} onPress={() => Linking.openURL(`tel:${a.etudiant.telephone}`)}>
                <Ionicons name="call" size={16} color={colors.danger} />
                <Text style={styles.contactTexte}>Appeler</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.contact} onPress={() => Linking.openURL(`mailto:${a.etudiant.email}`)}>
              <Ionicons name="mail" size={16} color={colors.danger} />
              <Text style={styles.contactTexte}>E-mail</Text>
            </TouchableOpacity>
          </View>
          {ouverte === a.id ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <TextInput
                style={styles.note}
                placeholder="Note (facultatif) : appel passé, rendez-vous fixé…"
                placeholderTextColor={colors.textFaint}
                value={note}
                onChangeText={setNote}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button label="Annuler" variant="outline" size="sm" onPress={() => { setOuverte(null); setNote(''); }} />
                <Button label="Confirmer" size="sm" loading={envoi} onPress={() => traiter(a)} />
              </View>
            </View>
          ) : (
            <Button label="J'ai recontacté l'étudiant" size="sm" onPress={() => setOuverte(a.id)} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  boite: { marginHorizontal: spacing.lg, marginTop: spacing.lg, borderWidth: 2, borderColor: colors.danger, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.white },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titre: { fontSize: 16, fontWeight: '700', color: colors.danger },
  sous: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  alerte: { backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  nom: { fontSize: 15, fontWeight: '700', color: colors.text },
  info: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  contacts: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.white, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  contactTexte: { fontSize: 13, fontWeight: '700', color: colors.danger },
  note: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.sm, minHeight: 60, fontSize: 14, color: colors.text, textAlignVertical: 'top' },
});
