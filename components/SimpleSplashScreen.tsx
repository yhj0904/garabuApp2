import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View, Platform } from 'react-native';

interface SimpleSplashScreenProps {
  onLoadingComplete?: () => void;
}

// 기본 색상 정의 (Theme Context가 준비되기 전에 사용)
const defaultColors = {
  background: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  primary: '#3B82F6',
};

export default function SimpleSplashScreen({ onLoadingComplete }: SimpleSplashScreenProps) {
  // Android에서 Theme Context가 준비되지 않았을 때를 대비한 안전한 처리
  let colors = defaultColors;
  
  try {
    // Theme Context를 시도하되, 실패하면 기본값 사용
    const { useTheme } = require('@/contexts/ThemeContext');
    const theme = useTheme();
    if (theme?.colors) {
      colors = theme.colors;
    }
  } catch (error) {
    console.log('Theme not ready, using default colors');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* 앱 로고 */}
        <View style={styles.logoContainer}>
          {/* 이미지 로딩 실패 시 대체 텍스트 표시 */}
          <View style={[styles.logoImageContainer, { backgroundColor: colors.background }]}>
            <Image 
              source={require('@/assets/images/GarabuLogo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => console.log('Logo image failed to load')}
            />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Garabu</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            당신의 일상을 더 스마트하게
          </Text>
        </View>

        {/* 로딩 인디케이터 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.spinner}
          />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            앱을 준비하고 있습니다...
          </Text>
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
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
  logoImageContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
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
    width: '80%',
  },
  spinner: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
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