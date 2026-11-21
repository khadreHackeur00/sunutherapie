import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Card, Button, Badge } from '../../components/ui';
import { MODULES, QUAND_DEMANDER_AIDE, RESPIRATION } from '../../config/psychoeducation';
import { colors, spacing, radius } from '../../config/theme';

const CLE_LUS = 'sunu_modules_lus';

// Liste des modules, ou un module si route.params.id est fourni.
export default function BienEtreScreen({ navigation, route }) {
  const id = route?.params?.id;
  const m = MODULES.find((x) => x.id === id);
  const [lus, setLus] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(CLE_LUS).then((v) => {
      const liste = v ? JSON.parse(v) : [];
      if (m && !liste.includes(m.id)) {
        liste.push(m.id);
        AsyncStorage.setItem(CLE_LUS, JSON.stringify(liste)).catch(() => {});
      }
      setLus(liste);
    }).catch(() => {});
  }, [m]);

  return (
    <Screen scroll contentStyle={styles.contenu}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.titre} numberOfLines={2}>{m ? m.titre : 'Prendre soin de soi'}</Text>
      </View>
      <Text style={styles.sous}>{m ? m.resume : 'Des modules courts pour comprendre ce que vous vivez et trouver des pistes concrètes.'}</Text>

      {m ? <Module m={m} navigation={navigation} /> : (
        <View style={{ gap: spacing.md }}>
          {MODULES.map((x) => (
            <Card key={x.id} onPress={() => navigation.push('BienEtre', { id: x.id })}>
              <View style={styles.carteH}>
                <Text style={styles.carteTitre}>{x.titre}</Text>
                {lus.includes(x.id) ? <Badge label="Lu" tone="success" /> : null}
              </View>
              <Text style={styles.carteTexte}>{x.resume}</Text>
              <Text style={styles.duree}>{x.duree} de lecture</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Module({ m, navigation }) {
  const suivant = MODULES[(MODULES.indexOf(m) + 1) % MODULES.length];
  return (
    <View style={{ gap: spacing.md }}>
      {m.sections.map((s) => (
        <Card key={s.titre}>
          <Text style={styles.sectionTitre}>{s.titre}</Text>
          {(s.texte || []).map((t) => <Text key={t} style={styles.paragraphe}>{t}</Text>)}
          {(s.points || []).map((p) => (
            <View key={p} style={styles.point}>
              <Text style={styles.puce}>•</Text>
              <Text style={styles.pointTexte}>{p}</Text>
            </View>
          ))}
        </Card>
      ))}

      {m.exercice === 'respiration' ? <Respiration /> : null}

      <Card style={{ backgroundColor: colors.accentLight }}>
        <Text style={styles.sectionTitre}>Quand demander de l'aide</Text>
        {QUAND_DEMANDER_AIDE.map((t) => (
          <View key={t} style={styles.point}>
            <Text style={styles.puce}>•</Text>
            <Text style={styles.pointTexte}>{t}</Text>
          </View>
        ))}
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button label="Parler à un psychothérapeute" onPress={() => navigation.navigate('StudentTabs', { screen: 'Consultations' })} full />
          <Button label="Faire le point" variant="outline" onPress={() => navigation.navigate('Evaluation')} full />
        </View>
      </Card>

      <Card onPress={() => navigation.replace('BienEtre', { id: suivant.id })}>
        <Text style={styles.duree}>Module suivant</Text>
        <Text style={styles.suivant}>{suivant.titre} →</Text>
      </Card>
    </View>
  );
}

function Respiration() {
  const { inspiration, expiration, cycles } = RESPIRATION;
  const duree = inspiration + expiration;
  const total = duree * cycles;
  const [ecoule, setEcoule] = useState(null);
  const echelle = useRef(new Animated.Value(1)).current;

  const actif = ecoule !== null && ecoule < total;
  const fini = ecoule !== null && ecoule >= total;
  const dansCycle = (ecoule ?? 0) % duree;
  const phase = dansCycle < inspiration ? 'inspire' : 'expire';
  const reste = phase === 'inspire' ? inspiration - dansCycle : duree - dansCycle;

  useEffect(() => {
    if (!actif) return undefined;
    const t = setTimeout(() => setEcoule((e) => e + 1), 1000);
    return () => clearTimeout(t);
  }, [actif, ecoule]);

  // Lance l'animation au début de chaque phase.
  useEffect(() => {
    if (!actif) { echelle.setValue(1); return; }
    if (dansCycle === 0 || dansCycle === inspiration) {
      Animated.timing(echelle, {
        toValue: phase === 'inspire' ? 1.7 : 1,
        duration: (phase === 'inspire' ? inspiration : expiration) * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [actif, dansCycle, phase]);

  return (
    <Card>
      <Text style={styles.sectionTitre}>Respiration guidée</Text>
      <Text style={styles.paragraphe}>Inspirez {inspiration} secondes, expirez {expiration} secondes. {cycles} cycles, environ une minute.</Text>
      <View style={styles.respZone} accessibilityLiveRegion="polite">
        <Animated.View style={[styles.cercle, { transform: [{ scale: echelle }] }]}>
          <Text style={styles.cercleTexte}>{actif ? (phase === 'inspire' ? 'Inspirez' : 'Expirez') : fini ? 'Bien joué' : 'Prêt ?'}</Text>
          {actif ? <Text style={styles.cercleNb}>{reste}</Text> : null}
        </Animated.View>
      </View>
      {actif
        ? <Button label="Arrêter" variant="outline" size="sm" onPress={() => setEcoule(null)} />
        : <Button label={fini ? 'Recommencer' : 'Commencer'} size="sm" onPress={() => setEcoule(0)} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: spacing.lg, paddingBottom: spacing.xxl },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  titre: { flex: 1, fontSize: 24, fontWeight: '700', color: colors.text },
  sous: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg, lineHeight: 20 },
  carteH: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  carteTitre: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  carteTexte: { fontSize: 14, color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  duree: { fontSize: 12, color: colors.textFaint, marginTop: 6 },
  sectionTitre: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  paragraphe: { fontSize: 15, color: colors.text, lineHeight: 23, marginBottom: spacing.sm },
  point: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  puce: { fontSize: 15, color: colors.primary, lineHeight: 23 },
  pointTexte: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 23 },
  suivant: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginTop: 2 },
  respZone: { height: 210, alignItems: 'center', justifyContent: 'center' },
  cercle: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.primaryLight, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  cercleTexte: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  cercleNb: { fontSize: 20, fontWeight: '700', color: colors.primaryDark },
});
