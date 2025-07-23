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

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const { signup, signupWithKakao, signupWithGoogle, signupWithApple, isLoading, isAuthenticated } = useAuthStore();
  const { colors, isDarkMode } = useTheme();

  // 회원가입 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', passwordValidation.message);
      return;
    }

    try {
      const result = await signup(email, username, password, username); // name으로 username 사용
      
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('회원가입 실패', result.error || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('회원가입 실패', error.message || '회원가입 중 오류가 발생했습니다.');
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleKakaoSignup = async () => {
    const success = await signupWithKakao();
    
    if (!success) {
      Alert.alert('카카오 회원가입 실패', '다시 시도해주세요.');
    }
  };

  const handleGoogleSignup = async () => {
    const success = await signupWithGoogle();
    
    if (!success) {
      Alert.alert('구글 회원가입 실패', '다시 시도해주세요.');
    }
  };

  const handleAppleSignup = async () => {
    const success = await signupWithApple();
    
    if (!success) {
      Alert.alert('애플 회원가입 실패', '다시 시도해주세요.');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;

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
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                회원가입
              </ThemedText>
            </View>

            {/* 회원가입 폼 */}
            <View style={styles.formContainer}>
              <ThemedInput
                label="사용자명"
                leftIcon="person"
                placeholder="사용자명을 입력하세요"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

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
                autoComplete="new-password"
              />
              
              {/* 비밀번호 강도 표시 */}
              {password.length > 0 && (
                <PasswordStrengthIndicator password={password} />
              )}

              <ThemedInput
                label="비밀번호 확인"
                leftIcon="lock-closed"
                rightIcon={isConfirmPasswordVisible ? "eye-off" : "eye"}
                onRightIconPress={toggleConfirmPasswordVisibility}
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
              />

              {/* 비밀번호 일치 표시 */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  <Ionicons 
                    name={passwordsMatch ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={passwordsMatch ? colors.success : colors.error} 
                  />
                  <ThemedText 
                    type="caption" 
                    variant={passwordsMatch ? "success" : "error"}
                    style={styles.matchText}
                  >
                    {passwordsMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                  </ThemedText>
                </View>
              )}

              {/* 회원가입 버튼 */}
              <ThemedButton
                variant="primary"
                size="large"
                loading={isLoading}
                disabled={!passwordsMatch || !username || !email || !password}
                onPress={handleSignup}
                style={styles.signupButton}
              >
                <Ionicons name="person-add" size={20} color={colors.textInverse} style={{ marginRight: 8 }} />
                {isLoading ? '회원가입 중...' : '회원가입'}
              </ThemedButton>

              {/* 로그인 링크 */}
              <View style={styles.loginContainer}>
                <ThemedText type="body" variant="secondary">
                  이미 계정이 있으신가요?{' '}
                </ThemedText>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <ThemedText type="body" variant="primary" weight="semibold">
                    로그인
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

              {/* 소셜 회원가입 버튼들 */}
              <View style={styles.socialButtonsContainer}>
                {/* 카카오 회원가입 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { backgroundColor: '#FEE500' }, // 카카오 노란색
                  ]}
                  onPress={handleKakaoSignup}
                  activeOpacity={0.8}
                >
                  <ThemedText type="button" style={[styles.socialButtonText, { color: '#000000' }]}>
                    카카오로 회원가입
                  </ThemedText>
                </TouchableOpacity>

                {/* 구글 회원가입 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { 
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleGoogleSignup}
                  activeOpacity={0.8}
                >
                  <ThemedText type="button" style={[styles.socialButtonText, { color: colors.text }]}>
                    구글로 회원가입
                  </ThemedText>
                </TouchableOpacity>

                {/* 애플 회원가입 버튼 (iOS만) */}
                {Platform.OS === 'ios' && (
                  <View style={{ width: '100%' }}>
                    {appleService.renderButton({
                      onPress: handleAppleSignup,
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
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
  },
  signupButton: {
    marginTop: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    marginLeft: 6,
    fontWeight: '500',
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