import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen, Button } from '../../components/ui';
import { TexteConsentement, CaseConsentement } from '../../components/TexteConsentement';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../config/theme';

// Affiché aux étudiants qui n'ont pas encore accepté le cadre de confidentialité.
export default function ConsentementScreen() {
  const { accepterConsentement, logout } = useAuth();
  const [coche, setCoche] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  const valider = async () => {
    setErreur(null);
    setEnvoi(true);
    try {
      await accepterConsentement();
    } catch (e) {
      setErreur(e.message);
      setEnvoi(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.contenu}>
      <Text style={styles.titre}>Avant de commencer</Text>
      <Text style={styles.sous}>Prenez une minute pour lire comment SunuThérapie protège vos informations.</Text>
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
      <TexteConsentement />
      <CaseConsentement coche={coche} onChange={setCoche} />
      <View style={styles.actions}>
        <Button label="Se déconnecter" variant="outline" size="sm" onPress={logout} />
        <Button label="Continuer" onPress={valider} disabled={!coche} loading={envoi} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: spacing.lg, paddingBottom: spacing.xxl },
  titre: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  sous: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg },
  erreur: { backgroundColor: colors.dangerLight, color: colors.danger, padding: spacing.md, borderRadius: 10, marginBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
