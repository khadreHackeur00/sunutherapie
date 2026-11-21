import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../config/theme';
import { CONSENTEMENT } from '../config/evaluation';

export function TexteConsentement() {
  return (
    <View style={{ gap: spacing.sm }}>
      {CONSENTEMENT.map((c) => (
        <View key={c.titre} style={styles.item}>
          <Text style={styles.titre}>{c.titre}</Text>
          <Text style={styles.texte}>{c.texte}</Text>
        </View>
      ))}
    </View>
  );
}

export function CaseConsentement({ coche, onChange }) {
  return (
    <TouchableOpacity
      style={styles.case}
      onPress={() => onChange(!coche)}
      activeOpacity={0.8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: coche }}
    >
      <Ionicons name={coche ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
      <Text style={styles.caseTexte}>J'ai lu ces informations et j'accepte d'utiliser SunuThérapie dans ce cadre.</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  titre: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, marginBottom: 3 },
  texte: { fontSize: 13.5, lineHeight: 19, color: colors.text },
  case: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginVertical: spacing.md },
  caseTexte: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
});
