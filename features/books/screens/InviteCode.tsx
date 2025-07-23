import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createBookInviteCode } from '@/services/inviteService';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';

export default function InviteCodeModal() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { bookId, bookTitle } = useLocalSearchParams<{ bookId: string; bookTitle: string }>();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [ttlSeconds, setTtlSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [codeCache, setCodeCache] = useState<{ EDITOR?: { code: string; expiresAt: number }; VIEWER?: { code: string; expiresAt: number } }>({});

  useEffect(() => {
    // 초기 로드 시 캐시된 코드 확인 또는 새 코드 생성
    checkOrGenerateCode();
  }, [selectedRole]);

  useEffect(() => {
    // TTL 카운트다운
    const interval = setInterval(() => {
      setTtlSeconds((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkOrGenerateCode = async () => {
    // 캐시된 코드 확인
    const cached = codeCache[selectedRole];
    const now = Date.now();
    
    if (cached && cached.expiresAt > now) {
      // 캐시된 코드가 유효한 경우 사용
      setInviteCode(cached.code);
      const remainingSeconds = Math.floor((cached.expiresAt - now) / 1000);
      setTtlSeconds(remainingSeconds);
      setLoading(false);
    } else {
      // 새 코드 생성
      await generateCode();
    }
  };

  const generateCode = async () => {
    try {
      setLoading(true);
      const response = await createBookInviteCode(Number(bookId), selectedRole);
      setInviteCode(response.code);
      setTtlSeconds(response.ttlSeconds);
      
      // 캐시에 저장
      setCodeCache(prev => ({
        ...prev,
        [selectedRole]: {
          code: response.code,
          expiresAt: Date.now() + (response.ttlSeconds * 1000)
        }
      }));
    } catch (error: any) {
      Alert.alert('오류', error.message || '초대 코드 생성에 실패했습니다.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다.');
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `"${bookTitle}" 가계부에 초대합니다!\n\n초대 코드: ${inviteCode}\n권한: ${selectedRole === 'EDITOR' ? '편집자' : '조회자'}\n\n 앱에서 이 코드를 입력하여 참가하세요.`,
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>가계부 초대</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.bookTitle, { color: colors.text }]}>{bookTitle}</Text>
        
        <View style={styles.roleSelector}>
          <Text style={[styles.roleSelectorTitle, { color: colors.textSecondary }]}>초대할 권한 선택</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, { borderColor: colors.border }, selectedRole === 'VIEWER' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedRole('VIEWER')}
            >
              <Text style={[styles.roleButtonText, { color: colors.textSecondary }, selectedRole === 'VIEWER' && { color: 'white', fontWeight: '600' }]}>
                조회자
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, { borderColor: colors.border }, selectedRole === 'EDITOR' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedRole('EDITOR')}
            >
              <Text style={[styles.roleButtonText, { color: colors.textSecondary }, selectedRole === 'EDITOR' && { color: 'white', fontWeight: '600' }]}>
                편집자
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.codeContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>초대 코드</Text>
          <Text style={[styles.codeText, { color: colors.primary }]}>{inviteCode}</Text>
          <Text style={[styles.ttlText, { color: colors.destructive }]}>
            남은 시간: {formatTime(ttlSeconds)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]} onPress={copyToClipboard}>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>복사하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]} onPress={shareCode}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>공유하기</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={() => {
          // 캐시 무효화하고 새 코드 생성
          setCodeCache(prev => ({ ...prev, [selectedRole]: undefined }));
          generateCode();
        }}>
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.refreshButtonText, { color: colors.textSecondary }]}>새 코드 생성</Text>
        </TouchableOpacity>

        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 초대 코드는 30분간 유효합니다.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 초대받은 사용자는 이 코드로 가계부 참가를 요청할 수 있습니다.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 참가 요청은 가계부 설정에서 수락/거절할 수 있습니다.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleSelector: {
    marginBottom: 30,
  },
  roleSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  // roleButtonActive now handled inline
  roleButtonText: {
    fontSize: 16,
  },
  // roleButtonTextActive now handled inline
  codeContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 8,
  },
  ttlText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 30,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  infoContainer: {
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
}); 