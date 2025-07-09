import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* 앱 로고 */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/GarabuLogo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Garabu</Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            당신의 일상을 더 스마트하게
          </Text>
        </View>

        {/* 로딩 인디케이터 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={styles.spinner}
          />
          <Text style={[styles.statusText, { color: colors.icon }]}>
            앱을 준비하고 있습니다...
          </Text>
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.icon }]}>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  spinner: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 