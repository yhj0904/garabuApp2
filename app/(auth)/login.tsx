import appleService from '@/features/auth/services/appleService';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { validatePassword } from '@/utils/passwordValidator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEvents } from '@/utils/analytics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const { login, loginWithKakao, loginWithGoogle, loginWithApple, isLoading, isAuthenticated } = useAuthStore();
  const { colors, isDarkMode } = useTheme();
  const { logEvent } = useAnalytics();

  // 로그인 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 유효성 검사 (로그인 시에는 너무 엄격하지 않게)
    if (password.length < 6) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const success = await login(email, password);
      
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Analytics: 로그인 성공
        logEvent(AnalyticsEvents.LOGIN, {
          method: 'email'
        });
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('로그인 실패', error.message || '이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  const handleKakaoLogin = async () => {
    const success = await loginWithKakao();
    
    if (success) {
      // Analytics: 카카오 로그인 성공
      logEvent(AnalyticsEvents.LOGIN, {
        method: 'kakao'
      });
    }
    // 사용자가 취소한 경우는 아무 메시지도 표시하지 않음
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    
    if (success) {
      // Analytics: 구글 로그인 성공
      logEvent(AnalyticsEvents.LOGIN, {
        method: 'google'
      });
    }
    // 사용자가 취소한 경우는 아무 메시지도 표시하지 않음
  };

  const handleAppleLogin = async () => {
    const success = await loginWithApple();
    
    if (success) {
      // Analytics: 애플 로그인 성공
      logEvent(AnalyticsEvents.LOGIN, {
        method: 'apple'
      });
    }
    // 사용자가 취소한 경우는 아무 메시지도 표시하지 않음
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* 로고 또는 앱 이름 */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="wallet" size={40} color={colors.textInverse} />
              </View>
              <ThemedText type="title" style={styles.logoText}>
                Garabu
              </ThemedText>
              <ThemedText type="body" variant="secondary" style={styles.subtitle}>
                가라부에 오신 것을 환영합니다
              </ThemedText>
            </View>

            {/* 로그인 폼 */}
            <View style={styles.formContainer}>
              <ThemedInput
                label="이메일"
                leftIcon="mail"
                placeholder="이메일을 입력하세요"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />

              <ThemedInput
                label="비밀번호"
                leftIcon="lock-closed"
                rightIcon={isPasswordVisible ? "eye-off" : "eye"}
                onRightIconPress={togglePasswordVisibility}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />
              
              {/* 비밀번호 강도 표시 */}
              {password.length > 0 && (
                <PasswordStrengthIndicator password={password} />
              )}

              {/* 로그인 버튼 */}
              <ThemedButton
                variant="primary"
                size="large"
                loading={isLoading}
                onPress={handleLogin}
                style={styles.loginButton}
              >
                <Ionicons name="log-in" size={20} color={colors.textInverse} style={{ marginRight: 8 }} />
                {isLoading ? '로그인 중...' : '로그인'}
              </ThemedButton>

              {/* 회원가입 링크 */}
              <View style={styles.signUpContainer}>
                <ThemedText type="body" variant="secondary">
                  계정이 없으신가요?{' '}
                </ThemedText>
                <TouchableOpacity onPress={handleSignUp}>
                  <ThemedText type="body" variant="primary" weight="semibold">
                    회원가입
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* 구분선 */}
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ThemedText type="caption" variant="tertiary" style={styles.dividerText}>
                  OR
                </ThemedText>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              {/* 소셜 로그인 버튼들 */}
              <View style={styles.socialButtonsContainer}>
                {/* 카카오 로그인 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { backgroundColor: '#FEE500' }, // 카카오 노란색
                  ]}
                  onPress={handleKakaoLogin}
                  activeOpacity={0.8}
                >
                  <ThemedText type="button" style={[styles.socialButtonText, { color: '#000000' }]}>
                    카카오 로그인
                  </ThemedText>
                </TouchableOpacity>

                {/* 구글 로그인 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { 
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                >
                  <ThemedText type="button" style={[styles.socialButtonText, { color: colors.text }]}>
                    구글 로그인
                  </ThemedText>
                </TouchableOpacity>

                {/* 애플 로그인 버튼 (iOS만) */}
                {Platform.OS === 'ios' && (
                  <View style={{ width: '100%' }}>
                    {appleService.renderButton({
                      onPress: handleAppleLogin,
                      style: { width: '100%', height: 50 },
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: 20,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 16,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    gap: 12,
  },
  socialButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  socialButtonText: {
    fontWeight: '600',
  },
}); 