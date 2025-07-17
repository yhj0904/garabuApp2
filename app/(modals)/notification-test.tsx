import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { firebaseService } from '@/services/firebaseService';
import { notificationService } from '@/services/notificationService';
import apiService from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationTestScreen() {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [testMessage, setTestMessage] = useState('테스트 알림 메시지입니다');

  useEffect(() => {
    loadFCMToken();
  }, []);

  const loadFCMToken = async () => {
    try {
      // 저장된 토큰 확인
      const savedToken = await AsyncStorage.getItem('fcmToken');
      if (savedToken) {
        setFcmToken(savedToken);
        setIsTokenRegistered(true);
      }
    } catch (error) {
      console.error('토큰 로드 실패:', error);
    }
  };

  const generateNewToken = async () => {
    try {
      const token = await firebaseService.getFCMToken();
      if (token) {
        setFcmToken(token);
        Alert.alert('성공', 'FCM 토큰이 생성되었습니다');
      } else {
        Alert.alert('실패', 'FCM 토큰 생성에 실패했습니다');
      }
    } catch (error) {
      Alert.alert('오류', '토큰 생성 중 오류가 발생했습니다');
    }
  };

  const registerTokenToServer = async () => {
    if (!fcmToken) {
      Alert.alert('오류', '먼저 FCM 토큰을 생성해주세요');
      return;
    }

    try {
      await notificationService.registerTokenWithServer(fcmToken);
      setIsTokenRegistered(true);
      Alert.alert('성공', '서버에 토큰이 등록되었습니다');
    } catch (error) {
      Alert.alert('실패', '서버 등록에 실패했습니다');
    }
  };

  const sendTestNotification = async () => {
    if (!isTokenRegistered) {
      Alert.alert('오류', '먼저 토큰을 서버에 등록해주세요');
      return;
    }

    try {
      // 서버에 테스트 알림 요청 - /api/v2/notifications/send/test 엔드포인트 사용
      const response = await apiService.sendTestNotification({});
      Alert.alert('성공', '테스트 알림을 전송했습니다. 곧 알림이 도착할 예정입니다.');
    } catch (error) {
      console.error('테스트 알림 전송 오류:', error);
      Alert.alert('실패', '알림 전송에 실패했습니다');
    }
  };

  const scheduleLocalNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification({
        title: '로컬 알림 테스트',
        body: testMessage,
        data: { type: 'test' },
      });
      Alert.alert('성공', '로컬 알림이 예약되었습니다');
    } catch (error) {
      Alert.alert('실패', '로컬 알림 예약에 실패했습니다');
    }
  };

  const subscribeToTestTopic = async () => {
    try {
      await firebaseService.subscribeToTopic('test_notifications');
      Alert.alert('성공', 'test_notifications 토픽을 구독했습니다');
    } catch (error) {
      Alert.alert('실패', '토픽 구독에 실패했습니다');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '알림 테스트',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FCM 토큰 관리</Text>
          
          <View style={styles.tokenContainer}>
            <Text style={styles.label}>현재 FCM 토큰:</Text>
            <Text style={styles.token} numberOfLines={3}>
              {fcmToken || '토큰 없음'}
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={generateNewToken}>
            <Text style={styles.buttonText}>새 토큰 생성</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, !fcmToken && styles.disabledButton]} 
            onPress={registerTokenToServer}
            disabled={!fcmToken}
          >
            <Text style={styles.buttonText}>서버에 토큰 등록</Text>
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              서버 등록 상태: {isTokenRegistered ? '✅ 등록됨' : '❌ 미등록'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 테스트</Text>
          
          <TextInput
            style={styles.input}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="테스트 메시지 입력"
            multiline
          />

          <TouchableOpacity 
            style={[styles.button, !isTokenRegistered && styles.disabledButton]} 
            onPress={sendTestNotification}
            disabled={!isTokenRegistered}
          >
            <Text style={styles.buttonText}>서버에서 푸시 알림 보내기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={scheduleLocalNotification}>
            <Text style={styles.buttonText}>로컬 알림 테스트</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={subscribeToTestTopic}>
            <Text style={styles.buttonText}>테스트 토픽 구독</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 테스트 방법</Text>
          <Text style={styles.infoText}>
            1. "새 토큰 생성" 버튼을 눌러 FCM 토큰을 생성합니다.{'\n'}
            2. "서버에 토큰 등록" 버튼을 눌러 서버에 등록합니다.{'\n'}
            3. "서버에서 푸시 알림 보내기"를 눌러 테스트합니다.{'\n'}
            4. 앱이 백그라운드에 있을 때 알림이 표시됩니다.{'\n'}
            5. 로컬 알림은 즉시 표시됩니다.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tokenContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  token: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 60,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});