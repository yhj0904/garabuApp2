import { Colors } from '@/constants/Colors';
import appleService from '@/features/auth/services/appleService';
import { useColorScheme } from '@/hooks/useColorScheme';
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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { validatePassword } from '@/utils/passwordValidator';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const { login, loginWithKakao, loginWithGoogle, loginWithApple, isLoading, isAuthenticated } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 로그인 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

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
    
    if (!success) {
      Alert.alert('카카오 로그인 실패', '다시 시도해주세요.');
    }
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    
    if (!success) {
      Alert.alert('구글 로그인 실패', '다시 시도해주세요.');
    }
  };

  const handleAppleLogin = async () => {
    const success = await loginWithApple();
    
    if (!success) {
      Alert.alert('애플 로그인 실패', '다시 시도해주세요.');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* 로고 또는 앱 이름 */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: colors.tint }]}>
                <Ionicons name="wallet" size={40} color="white" />
              </View>
              <Text style={[styles.logoText, { color: colors.tint }]}>Garabu</Text>
              <Text style={[styles.subtitle, { color: colors.icon }]}>
                가라부에 오신 것을 환영합니다
              </Text>
            </View>


            {/* 로그인 폼 */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="mail" size={16} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>이메일</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                      color: colors.text,
                      borderColor: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
                    },
                  ]}
                  placeholder="이메일을 입력하세요"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="lock-closed" size={16} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>비밀번호</Text>
                </View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                        color: colors.text,
                        borderColor: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
                      },
                    ]}
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={togglePasswordVisibility}
                  >
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off" : "eye"} 
                      size={20} 
                      color={colors.icon} 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* 비밀번호 강도 표시 */}
                {password.length > 0 && (
                  <PasswordStrengthIndicator password={password} />
                )}
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: colors.tint,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in" size={20} color="white" />
                <Text style={styles.loginButtonText}>
                  {isLoading ? '로그인 중...' : '로그인'}
                </Text>
              </TouchableOpacity>

              {/* 회원가입 링크 */}
              <View style={styles.signUpContainer}>
                <Text style={[styles.signUpText, { color: colors.icon }]}>
                  계정이 없으신가요?{' '}
                </Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={[styles.signUpLink, { color: colors.tint }]}>
                    회원가입
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 구분선 */}
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.icon }]} />
                <Text style={[styles.dividerText, { color: colors.icon }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.icon }]} />
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
                  <Text style={[styles.socialButtonText, { color: '#000000' }]}>
                    카카오 로그인
                  </Text>
                </TouchableOpacity>

                {/* 구글 로그인 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { 
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E0E0E0',
                    },
                  ]}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.socialButtonText, { color: '#000000' }]}>
                    구글 로그인
                  </Text>
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
    </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 15,
    padding: 4,
  },
  loginButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '600',
  },
}); 