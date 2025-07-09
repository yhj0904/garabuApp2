import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { oauth } from '@/services/oauthService';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const { signup, oauthLogin, isLoading, isAuthenticated } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 로그인 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleSignup = async () => {
    if (!email || !username || !name || !password || !confirmPassword) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    const success = await signup(email, username, password, name);
    
    if (!success) {
      Alert.alert('회원가입 실패', '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'naver') => {
    try {
      let result;
      
      if (provider === 'google') {
        result = await oauth.googleLogin();
      } else {
        result = await oauth.naverLogin();
      }
      
      if (result.success && result.accessToken) {
        const success = await oauthLogin(provider, result.accessToken, result.refreshToken);
        
        if (!success) {
          Alert.alert('로그인 실패', `${provider} 로그인 중 오류가 발생했습니다.`);
        }
      } else {
        Alert.alert('로그인 실패', result.error || `${provider} 로그인 중 오류가 발생했습니다.`);
      }
    } catch (error) {
      Alert.alert('로그인 실패', `${provider} 로그인 중 오류가 발생했습니다.`);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

            {/* 소셜 로그인 버튼 */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton, 
                  styles.googleButton,
                  { opacity: isLoading ? 0.7 : 1 }
                ]}
                onPress={() => handleOAuthLogin('google')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={24} color="white" />
                <Text style={styles.socialButtonText}>
                  {isLoading ? '처리 중...' : 'Google로 계속하기'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.socialButton, 
                  styles.naverButton,
                  { opacity: isLoading ? 0.7 : 1 }
                ]}
                onPress={() => handleOAuthLogin('naver')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-html5" size={24} color="white" />
                <Text style={styles.socialButtonText}>
                  {isLoading ? '처리 중...' : 'Naver로 계속하기'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 구분선 */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.icon }]} />
              <Text style={[styles.dividerText, { color: colors.icon }]}>또는</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.icon }]} />
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
                  <Text style={[styles.label, { color: colors.text }]}>사용자명</Text>
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
                  placeholder="사용자명을 입력하세요"
                  placeholderTextColor={colors.icon}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="person-circle" size={16} color={colors.icon} />
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
                  placeholder="실명을 입력하세요"
                  placeholderTextColor={colors.icon}
                  value={name}
                  onChangeText={setName}
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
                    placeholder="비밀번호를 입력하세요 (최소 6자)"
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
  socialContainer: {
    marginBottom: 24,
  },
  socialButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
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
}); 