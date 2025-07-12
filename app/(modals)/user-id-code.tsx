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
import { useRouter } from 'expo-router';
import { createUserIdCode } from '../../services/inviteService';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/stores/authStore';

export default function UserIdCodeModal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [idCode, setIdCode] = useState<string>('');
  const [ttlSeconds, setTtlSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateCode();
  }, []);

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

  const generateCode = async () => {
    try {
      setLoading(true);
      const response = await createUserIdCode();
      setIdCode(response.code);
      setTtlSeconds(response.ttlSeconds);
    } catch (error: any) {
      Alert.alert('오류', error.message || '식별 코드 생성에 실패했습니다.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(idCode);
    Alert.alert('복사 완료', '식별 코드가 클립보드에 복사되었습니다.');
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `가라부 사용자 식별 코드\n\n사용자: ${user?.name || user?.username}\n코드: ${idCode}\n\n이 코드로 저를 가계부에 초대할 수 있습니다.`,
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>내 식별 코드</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={64} color="#007AFF" />
        </View>

        <Text style={styles.userName}>{user?.name || user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>사용자 식별 코드</Text>
          <Text style={styles.codeText}>{idCode}</Text>
          <Text style={styles.ttlText}>
            남은 시간: {formatTime(ttlSeconds)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
            <Ionicons name="copy-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>복사하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={shareCode}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>공유하기</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={generateCode}>
          <Ionicons name="refresh-outline" size={20} color="#666" />
          <Text style={styles.refreshButtonText}>새 코드 생성</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • 이 코드는 30분간 유효합니다.
          </Text>
          <Text style={styles.infoText}>
            • 다른 사용자가 이 코드로 당신을 가계부에 초대할 수 있습니다.
          </Text>
          <Text style={styles.infoText}>
            • 코드를 안전하게 보관하세요.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  codeContainer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  ttlText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
}); 