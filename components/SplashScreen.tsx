import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [progressAnim] = useState(new Animated.Value(0));
  const [loadingText, setLoadingText] = useState('앱을 준비하고 있습니다...');
  const [progress, setProgress] = useState(0);
  const { isLoading, isAuthenticated } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // 페이드인 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 진행률 애니메이션
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // 로딩 텍스트 변경
    const loadingMessages = [
      { text: '앱을 준비하고 있습니다...', progress: 20 },
      { text: '인증 상태를 확인하고 있습니다...', progress: 50 },
      { text: '데이터를 로드하고 있습니다...', progress: 80 },
      { text: '거의 완료되었습니다...', progress: 95 },
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++;
        setLoadingText(loadingMessages[messageIndex].text);
        setProgress(loadingMessages[messageIndex].progress);
      }
    }, 800);

    // 진행률 업데이트
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 95) {
          return prev + 1;
        }
        return prev;
      });
    }, 50);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [fadeAnim, scaleAnim, progressAnim]);

  // 인증 상태에 따른 메시지
  const getStatusMessage = () => {
    if (isLoading) {
      return loadingText;
    }
    if (isAuthenticated) {
      return '로그인되었습니다!';
    }
    return '로그인이 필요합니다.';
  };

  return (
    <LinearGradient
      colors={
        colorScheme === 'dark'
          ? ['#1a1a1a', '#2d2d2d', '#1a1a1a']
          : ['#f8f9fa', '#e9ecef', '#f8f9fa']
      }
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 앱 로고 */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.tint }]}>
            <Text style={styles.logoText}>G</Text>
          </View>
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
            {getStatusMessage()}
          </Text>
          
          {/* 진행률 바 */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.icon + '20' }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.tint,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.icon }]}>
              {progress}%
            </Text>
          </View>
        </View>

        {/* 버전 정보 */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.icon }]}>
            Version 1.0.0
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
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
    justifyContent: 'space-between',
    height: height * 0.7,
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
    width: '100%',
  },
  spinner: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 