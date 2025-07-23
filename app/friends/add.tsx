import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFriendStore } from '@/stores/friendStore';
import { useAuthStore } from '@/stores/authStore';
import apiService from '@/core/api/client';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';

export default function AddFriendScreen() {
  const [userCode, setUserCode] = useState('');
  const [myUserCode, setMyUserCode] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    generateMyCode();
  }, []);

  useEffect(() => {
    // TTL 카운트다운
    if (ttlSeconds > 0) {
      const interval = setInterval(() => {
        setTtlSeconds((prev) => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [ttlSeconds]);

  const generateMyCode = async () => {
    try {
      setLoading(true);
      const response = await apiService.createFriendInviteCode();
      setMyUserCode(response.code);
      setTtlSeconds(response.ttlSeconds);
    } catch (error: any) {
      console.error('친구 초대 코드 생성 실패:', error);
      Alert.alert('오류', '친구 초대 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!userCode.trim()) {
      Alert.alert('오류', '친구 초대 코드를 입력해주세요.');
      return;
    }

    try {
      // 8자리 숫자 코드 검증
      if (!/^\d{8}$/.test(userCode.trim())) {
        Alert.alert('오류', '올바른 8자리 친구 초대 코드를 입력해주세요.');
        return;
      }

      const response = await apiService.sendFriendRequestByCode(userCode.trim());
      Alert.alert('성공', '친구 요청을 보냈습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('친구 요청 실패:', error);
      let errorMessage = '친구 요청 중 문제가 발생했습니다.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('오류', errorMessage);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(myUserCode);
    Alert.alert('복사 완료', '내 식별 코드가 클립보드에 복사되었습니다.');
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `가라부 친구 초대 코드\n\n사용자: ${user?.name || user?.username}\n코드: ${myUserCode}\n\n이 코드로 저를 친구로 추가할 수 있습니다.\n\n※ 코드는 30분간 유효합니다.`,
      });
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>친구 초대 코드로 추가</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            친구의 8자리 초대 코드를 입력하여 친구 요청을 보낼 수 있습니다.
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="8자리 친구 초대 코드 입력"
            placeholderTextColor={colors.textTertiary}
            value={userCode}
            onChangeText={setUserCode}
            keyboardType="numeric"
            maxLength={8}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSendRequest}
          >
            <Text style={[styles.sendButtonText, { color: colors.textInverse }]}>친구 요청 보내기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>내 친구 초대 코드</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            친구에게 이 코드를 공유하여 친구 요청을 받을 수 있습니다.
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>코드 생성 중...</Text>
            </View>
          ) : (
            <>
              <View style={[styles.myCodeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.myCode, { color: colors.text }]}>{myUserCode || '--------'}</Text>
                <View style={styles.codeActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={copyToClipboard}
                  >
                    <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={shareCode}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {ttlSeconds > 0 && (
                <Text style={[styles.ttlText, { color: colors.textSecondary }]}>
                  남은 시간: {formatTime(ttlSeconds)}
                </Text>
              )}
              
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={generateMyCode}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.refreshButtonText, { color: colors.textSecondary }]}>새 코드 생성</Text>
              </TouchableOpacity>
              
              <View style={styles.infoContainer}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • 이 코드는 30분간 유효합니다.
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • 가계부 초대 코드와는 다른 별도의 친구 전용 코드입니다.
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • 코드를 안전하게 보관하세요.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  sendButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 20,
  },
  myCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  myCode: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  ttlText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 20,
  },
  refreshButtonText: {
    fontSize: 14,
  },
  infoContainer: {
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
});