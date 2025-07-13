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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const { login, oauthLogin, isLoading, isAuthenticated } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 로그인 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    const success = await login(email, password);
    
    if (!success) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'naver') => {
    console.log(`${provider} 로그인 버튼 클릭됨`);
    
    try {
      console.log(`${provider} OAuth 시작...`);
      let result;
      
      if (provider === 'google') {
        result = await oauth.googleLogin();
      } else {
        result = await oauth.naverLogin();
      }
      
      console.log(`${provider} OAuth 결과:`, result);
      
      if (result.success && result.accessToken) {
        console.log(`${provider} 토큰 획득 성공, 로그인 처리 중...`);
        const success = await oauthLogin(provider, result.accessToken, result.refreshToken);
        
        if (success) {
          console.log(`${provider} 로그인 성공!`);
        } else {
          console.log(`${provider} 로그인 실패`);
          Alert.alert('로그인 실패', `${provider} 로그인 중 오류가 발생했습니다.`);
        }
      } else {
        console.log(`${provider} OAuth 실패:`, result.error);
        Alert.alert('로그인 실패', result.error || `${provider} 로그인 중 오류가 발생했습니다.`);
      }
    } catch (error) {
      console.error(`${provider} OAuth 오류:`, error);
      Alert.alert('로그인 실패', `${provider} 로그인 중 오류가 발생했습니다.`);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
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

            {/* 소셜 로그인 버튼 */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton, 
                  styles.googleButton,
                  { opacity: isLoading ? 0.7 : 1 }
                ]}
                onPress={() => {
                  console.log('Google 버튼 터치됨');
                  handleOAuthLogin('google');
                }}
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
                onPress={() => {
                  console.log('Naver 버튼 터치됨');
                  handleOAuthLogin('naver');
                }}
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

              {/* 테스트 계정 정보 - 필요시 주석 해제
              <View style={[styles.testAccountContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="information-circle" size={16} color={colors.icon} />
                <Text style={[styles.testAccountText, { color: colors.icon }]}>
                  테스트 계정: test@example.com / password
                </Text>
              </View>
              */}

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
  testAccountContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testAccountText: {
    fontSize: 12,
    flex: 1,
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
}); 