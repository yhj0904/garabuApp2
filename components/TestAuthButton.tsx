import React from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';

export const TestAuthButton = () => {
  // 개발 환경에서만 표시
  if (!__DEV__) return null;

  const { colors } = useTheme();

  const testScenarios = [
    {
      title: '토큰 제거',
      action: async () => {
        await AsyncStorage.removeItem('auth-token');
        await AsyncStorage.removeItem('refreshToken');
        Alert.alert('테스트', '토큰이 제거되었습니다. 앱을 재시작하세요.');
      }
    },
    {
      title: '잘못된 토큰',
      action: async () => {
        await AsyncStorage.setItem('auth-token', 'invalid-token-12345');
        await AsyncStorage.setItem('refreshToken', 'invalid-refresh-token-12345');
        Alert.alert('테스트', '잘못된 토큰이 설정되었습니다. 앱을 재시작하세요.');
      }
    },
    {
      title: '오래된 토큰',
      action: async () => {
        // 2023년의 오래된 토큰 시뮬레이션
        const oldToken = 'eyJhbGciOiJIUzI1NiJ9.eyJjYXRlZ29yeSI6ImFjY2VzcyIsInVzZXJuYW1lIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE2OTYwODk2MDAsImV4cCI6MTY5NjA5MzIwMH0.fake-signature';
        await AsyncStorage.setItem('auth-token', oldToken);
        Alert.alert('테스트', '만료된 토큰이 설정되었습니다. 앱을 재시작하세요.');
      }
    },
    {
      title: '네트워크 오류 안내',
      action: () => {
        Alert.alert(
          '네트워크 오류 테스트',
          '1. 개발자 메뉴 열기 (기기 흔들기)\n' +
          '2. "Network" > "Go Offline" 선택\n' +
          '3. 앱 재시작\n' +
          '4. 타임아웃 후 로그인 화면으로 이동 확인'
        );
      }
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {testScenarios.map((scenario, index) => (
        <View key={index} style={styles.buttonWrapper}>
          <Button
            title={`테스트: ${scenario.title}`}
            onPress={scenario.action}
            color={colors.error}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    margin: 10,
  },
  buttonWrapper: {
    marginVertical: 5,
  },
}); 