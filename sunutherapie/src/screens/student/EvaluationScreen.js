import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, Badge } from '../../components/ui';
import { apiEnvoyerEvaluation, apiMesEvaluations } from '../../services/api';
import { CHOIX, QUESTIONNAIRES, SEVERITE, NIVEAUX, URGENCES } from '../../config/evaluation';
import { colors, spacing, radius } from '../../config/theme';

const TON_NIVEAU = { 1: 'primary', 2: 'info', 3: 'warning', 4: 'danger' };
const dateFr = (d) => new Date(String(d).replace(' ', 'T')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function EvaluationScreen({ navigation }) {
  const [type, setType] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [historique, setHistorique] = useState([]);

  const charger = useCallback(() => {
    apiMesEvaluations().then((r) => setHistorique(r?.data || [])).catch(() => {});
  }, []);
  useEffect(() => { charger(); }, [charger]);

  return (
    <Screen scroll contentStyle={styles.contenu}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => (type ? setType(null) : navigation.goBack())} hitSlop={12} accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.titre}>Faire le point</Text>
      </View>
      <Text style={styles.sous}>Deux questionnaires courts pour savoir comment vous allez. Vos réponses restent confidentielles.</Text>

      {resultat ? (
        <Resultat r={resultat} onAutre={() => setResultat(null)} onRdv={() => navigation.navigate('StudentTabs', { screen: 'Consultations' })} onModules={() => navigation.navigate('BienEtre')} />
      ) : null}

      {type ? (
        <Questionnaire type={type} onTermine={(r) => { setResultat(r); setType(null); charger(); }} />
      ) : !resultat ? (
        <View style={{ gap: spacing.md }}>
          {Object.entries(QUESTIONNAIRES).map(([k, q]) => (
            <Card key={k} onPress={() => setType(k)}>
              <Text style={styles.carteTitre}>{q.nom}</Text>
              <Text style={styles.carteSous}>{q.questions.length} questions · 2 minutes</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {!type ? (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.section}>Mes résultats</Text>
          {historique.length === 0 ? (
            <Text style={styles.vide}>Aucun questionnaire pour l'instant.</Text>
          ) : historique.map((e) => (
            <View key={e.id} style={styles.ligne}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ligneTitre}>{QUESTIONNAIRES[e.type]?.court} · {e.score}/{QUESTIONNAIRES[e.type]?.max}</Text>
                <Text style={styles.ligneSous}>{dateFr(e.created_at)} · {SEVERITE[e.severite] || e.severite}</Text>
              </View>
              <Badge label={`Niveau ${e.niveau_propose}`} tone={TON_NIVEAU[e.niveau_propose]} />
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function Questionnaire({ type, onTermine }) {
  const q = QUESTIONNAIRES[type];
  const [reponses, setReponses] = useState(Array(q.questions.length).fill(null));
  const [envoi, setEnvoi] = useState(false);
  const restantes = reponses.filter((r) => r === null).length;

  const envoyer = async () => {
    setEnvoi(true);
    try {
      const res = await apiEnvoyerEvaluation(type, reponses);
      if (!res?.success) throw new Error(res?.message || 'Envoi impossible');
      onTermine(res.data);
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Vérifiez votre connexion et réessayez.');
      setEnvoi(false);
    }
  };

  return (
    <View>
      <Text style={styles.carteTitre}>{q.nom}</Text>
      <Text style={[styles.sous, { marginTop: 4 }]}>{q.intro}</Text>
      {q.questions.map((texte, i) => (
        <View key={i} style={styles.question}>
          <Text style={styles.questionTexte}>{i + 1}. {texte}</Text>
          <View style={styles.options}>
            {CHOIX.map((c, v) => {
              const on = reponses[i] === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[styles.option, on && styles.optionOn]}
                  onPress={() => setReponses((rs) => rs.map((r, j) => (j === i ? v : r)))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.optionTexte, on && { color: colors.white }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
      <Button
        label={restantes ? `Encore ${restantes} réponse(s)` : 'Voir mon résultat'}
        onPress={envoyer}
        disabled={restantes > 0}
        loading={envoi}
        full
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

function Resultat({ r, onAutre, onRdv, onModules }) {
  const q = QUESTIONNAIRES[r.type];
  const n = NIVEAUX[r.niveau_propose];
  return (
    <Card style={[{ marginBottom: spacing.lg }, r.risque && styles.urgent]}>
      <Text style={styles.score}>{r.score}<Text style={styles.scoreMax}>/{q.max}</Text></Text>
      <Text style={styles.ligneSous}>{q.court} · {SEVERITE[r.severite] || r.severite}</Text>
      <Text style={styles.niveauTitre}>{n.titre}</Text>
      <Text style={styles.niveauTexte}>{n.texte}</Text>

      {r.risque ? (
        <View style={styles.urgence}>
          <Text style={styles.urgenceTitre}>En cas de danger immédiat, appelez :</Text>
          <View style={styles.numeros}>
            {URGENCES.map((u) => (
              <TouchableOpacity key={u.numero} style={styles.numero} onPress={() => Linking.openURL(`tel:${u.numero}`)}
                                accessibilityLabel={`Appeler ${u.nom}, ${u.numero}`}>
                <Text style={styles.numeroNb}>{u.numero}</Text>
                <Text style={styles.numeroNom}>{u.nom}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {r.niveau_propose >= 2 ? <Button label="Prendre rendez-vous" onPress={onRdv} full /> : null}
        {r.niveau_propose <= 2 ? <Button label="Modules « Prendre soin de soi »" variant="ghost" onPress={onModules} full /> : null}
        <Button label="Faire un autre questionnaire" variant="outline" onPress={onAutre} full />
      </View>
      <Text style={styles.note}>Ce résultat est une première indication, pas un diagnostic. Un professionnel le relira avec vous.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: spacing.lg, paddingBottom: spacing.xxl },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  titre: { fontSize: 24, fontWeight: '700', color: colors.text },
  sous: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg, lineHeight: 20 },
  carteTitre: { fontSize: 17, fontWeight: '700', color: colors.text },
  carteSous: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  question: { marginTop: spacing.lg },
  questionTexte: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, lineHeight: 21 },
  options: { gap: 8 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: colors.surface },
  optionOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionTexte: { fontSize: 14, color: colors.text },
  urgent: { borderWidth: 2, borderColor: colors.danger },
  score: { fontSize: 40, fontWeight: '700', color: colors.primaryDark },
  scoreMax: { fontSize: 18, color: colors.textMuted },
  niveauTitre: { fontSize: 19, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  niveauTexte: { fontSize: 14.5, color: colors.text, lineHeight: 21, marginTop: 4 },
  urgence: { backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  urgenceTitre: { fontWeight: '700', color: colors.text },
  numeros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  numero: { backgroundColor: colors.white, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  numeroNb: { fontSize: 22, fontWeight: '700', color: colors.danger },
  numeroNom: { fontSize: 12, color: colors.text },
  note: { fontSize: 12, color: colors.textFaint, marginTop: spacing.md },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  vide: { color: colors.textMuted },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  ligneTitre: { fontSize: 15, fontWeight: '600', color: colors.text },
  ligneSous: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
