import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../config/theme';

// Logos partenaires : même hauteur pour tous, la largeur suit le ratio de chaque fichier.
const LOGO_H = 30;
const PARTNERS = [
  { key: 'ucad', label: 'UCAD', img: require('../../assets/images/Logoucad.png'), ratio: 1 },
  { key: 'oms', label: 'Organisation mondiale de la Santé', img: require('../../assets/images/oms.png'), ratio: 3.62 },
  { key: 'mshp', label: "Ministère de la Santé et de l'Hygiène publique", img: require('../../assets/images/mshp.png'), ratio: 3.84 },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.jpeg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>SunuThérapie</Text>
        <Text style={styles.tagline}>Votre espace de santé mentale universitaire</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('LoginEtudiant')}
          activeOpacity={0.9}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="school" size={26} color={colors.white} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Je suis Étudiant</Text>
            <Text style={styles.cardSubtitle}>Accéder à mon espace étudiant</Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('LoginPsy')}
          activeOpacity={0.9}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="medkit" size={26} color={colors.white} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Je suis Psychothérapeute</Text>
            <Text style={styles.cardSubtitle}>Accéder à mon espace professionnel</Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.partnersLabel}>Avec le soutien de</Text>
        <View style={styles.logoStrip}>
          {PARTNERS.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 ? <View style={styles.logoDivider} /> : null}
              <Image source={p.img} style={{ height: LOGO_H, width: Math.round(LOGO_H * p.ratio) }}
                     resizeMode="contain" accessibilityLabel={p.label} />
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.footerText}>Financé par AMREF Health Africa & Fondation Mastercard</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center', paddingTop: spacing.huge, paddingBottom: spacing.xxxl,
    backgroundColor: colors.primary, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl,
  },
  logo: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.white, marginBottom: spacing.md },
  appName: { fontSize: 26, fontWeight: '700', color: colors.white },
  tagline: { fontSize: 13, color: colors.primaryLight, marginTop: 6, textAlign: 'center', paddingHorizontal: spacing.xl },

  cardsContainer: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, gap: spacing.lg },
  card: { borderRadius: radius.xl, padding: spacing.xl, flexDirection: 'row', alignItems: 'center', ...shadows.md },
  cardIconWrap: {
    width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg,
  },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3 },

  footer: { alignItems: 'center', paddingBottom: spacing.xl, paddingHorizontal: spacing.xl },
  partnersLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textFaint,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.md,
  },
  logoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch',
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  logoDivider: { width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: spacing.md },
  logoPlaceholder: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  footerText: { fontSize: 11, color: colors.textFaint, textAlign: 'center' },
});
