import { Colors } from '@/constants/Colors';
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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  // const [name, setName] = useState(''); // 서버 API에서 받지 않으므로 제거
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const { signup, isLoading, isAuthenticated } = useAuthStore();
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


  const handleSignup = async () => {
    if (!email || !username || !password || !confirmPassword) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (username.length < 2) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '이름은 최소 2자 이상이어야 합니다.');
      return;
    }

    // 유틸리티 함수 사용으로 변경
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    const result = await signup(email, username, password, username); // name 대신 username 사용
    
    if (!result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // 서버에서 반환한 구체적인 에러 메시지 표시
      Alert.alert('회원가입 실패', result.error || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };


  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.tint} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>회원가입</Text>
            </View>


            {/* 회원가입 폼 */}
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
                  <Ionicons name="person" size={16} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>이름</Text>
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
                  placeholder="이름을 입력하세요"
                  placeholderTextColor={colors.icon}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
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
                    placeholder="비밀번호를 입력하세요 (최소 8자)"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
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
                
                {/* 비밀번호 강도 표시 - 회원가입에서는 상세 표시 */}
                {password.length > 0 && (
                  <PasswordStrengthIndicator 
                    password={password} 
                    showRequirements={true}
                  />
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="lock-closed" size={16} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>비밀번호 확인</Text>
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
                    placeholder="비밀번호를 다시 입력하세요"
                    placeholderTextColor={colors.icon}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={toggleConfirmPasswordVisibility}
                  >
                    <Ionicons 
                      name={isConfirmPasswordVisible ? "eye-off" : "eye"} 
                      size={20} 
                      color={colors.icon} 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* 비밀번호 일치 여부 표시 */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    <Ionicons 
                      name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={password === confirmPassword ? '#00C851' : '#FF4444'} 
                    />
                    <Text style={[
                      styles.matchText, 
                      { color: password === confirmPassword ? '#00C851' : '#FF4444' }
                    ]}>
                      {password === confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                    </Text>
                  </View>
                )}
              </View>

              {/* 회원가입 버튼 */}
              <TouchableOpacity
                style={[
                  styles.signupButton,
                  {
                    backgroundColor: colors.tint,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.signupButtonText}>
                  {isLoading ? '회원가입 중...' : '회원가입'}
                </Text>
              </TouchableOpacity>

              {/* 로그인 링크 */}
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: colors.icon }]}>
                  이미 계정이 있으신가요?{' '}
                </Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={[styles.loginLink, { color: colors.tint }]}>
                    로그인
                  </Text>
                </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
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
  signupButton: {
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
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
}); 