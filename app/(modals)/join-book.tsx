import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { requestJoinBook } from '../../services/inviteService';
import { Ionicons } from '@expo/vector-icons';

export default function JoinBookModal() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // 숫자만 입력 가능
    const numericText = text.replace(/[^0-9]/g, '');
    
    // 현재 코드 배열
    const codeArray = code.split('');
    
    // 붙여넣기 처리
    if (numericText.length > 1) {
      const pastedCode = numericText.slice(0, 8);
      setCode(pastedCode);
      
      // 마지막 입력 칸으로 포커스 이동
      const lastIndex = Math.min(pastedCode.length - 1, 7);
      inputRefs.current[lastIndex]?.focus();
      return;
    }
    
    // 단일 문자 입력
    if (numericText) {
      codeArray[index] = numericText;
      setCode(codeArray.join(''));
      
      // 다음 입력 칸으로 포커스 이동
      if (index < 7) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // 현재 칸이 비어있고 백스페이스를 누르면 이전 칸으로 이동
      inputRefs.current[index - 1]?.focus();
      
      // 이전 칸의 값 삭제
      const codeArray = code.split('');
      codeArray[index - 1] = '';
      setCode(codeArray.join(''));
    }
  };

  const handleJoinRequest = async () => {
    if (code.length !== 8) {
      Alert.alert('알림', '8자리 초대 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await requestJoinBook(code);
      
      Alert.alert(
        '참가 요청 완료',
        `"${response.bookTitle}" 가계부에 참가 요청을 보냈습니다.\n\n가계부 소유자가 승인하면 가계부를 이용할 수 있습니다.`,
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || error.message || '참가 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>가계부 참가</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={64} color="#007AFF" />
        </View>

        <Text style={styles.instructionText}>
          초대받은 8자리 코드를 입력하세요
        </Text>

        <View style={styles.codeInputContainer}>
          {[...Array(8)].map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                code[index] && styles.codeInputFilled,
              ]}
              value={code[index] || ''}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            (code.length !== 8 || loading) && styles.joinButtonDisabled,
          ]}
          onPress={handleJoinRequest}
          disabled={code.length !== 8 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>참가 요청하기</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • 가계부 소유자로부터 받은 초대 코드를 입력하세요.
          </Text>
          <Text style={styles.infoText}>
            • 참가 요청 후 소유자의 승인이 필요합니다.
          </Text>
          <Text style={styles.infoText}>
            • 초대 코드는 30분간 유효합니다.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  codeInput: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 40,
    minWidth: 200,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
}); 