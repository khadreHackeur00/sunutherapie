import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, StatusBar } from 'react-native';
import { colors } from '../config/theme';

// Partenaires : même hauteur pour tous, largeur selon le ratio du fichier.
const LOGO_H = 28;
const PARTNERS = [
  { key: 'amref', label: 'AMREF Health Africa', img: require('../../assets/images/white.png'), ratio: 1.69 },
  { key: 'mastercard', label: 'Fondation Mastercard', img: require('../../assets/images/mastercard.png'), ratio: 1.21 },
  { key: 'ucad', label: 'UCAD', img: require('../../assets/images/Logoucad.png'), ratio: 1 },
  { key: 'oms', label: 'Organisation mondiale de la Santé', img: require('../../assets/images/oms.png'), ratio: 3.62 },
];

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 12, friction: 5, useNativeDriver: true }),
      Animated.timing(footerOpacity, { toValue: 1, duration: 1200, delay: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Welcome'), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/logo.jpeg')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>SunuThérapie</Text>
        <Text style={styles.tagline}>Santé mentale universitaire</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.footerLabel}>Nos partenaires</Text>
        <View style={styles.logosRow}>
          {PARTNERS.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 ? <View style={styles.separator} /> : null}
              <Image source={p.img} style={{ height: LOGO_H, width: Math.round(LOGO_H * p.ratio) }}
                     resizeMode="contain" accessibilityLabel={p.label} />
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.footerSub}>GIE FUAM — Pour les étudiants du Sénégal 🇸🇳</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  logo: { width: 140, height: 140 },
  appName: { fontSize: 32, fontWeight: '700', color: colors.white, letterSpacing: 1 },
  tagline: { fontSize: 14, color: colors.primaryLight, marginTop: 8 },
  footer: { position: 'absolute', bottom: 40, left: 20, right: 20, alignItems: 'center' },
  footerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  logosRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch',
    backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12,
  },
  separator: { width: 1, height: 22, backgroundColor: 'rgba(0,0,0,0.12)', marginHorizontal: 10 },
  footerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
});
