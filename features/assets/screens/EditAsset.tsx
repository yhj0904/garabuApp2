import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import type { Asset, UpdateAssetRequest } from '@/core/api/client';
import { formatAmountInput, parseFormattedNumber, formatKoreanAmount } from '@/utils/numberFormat';

export default function EditAssetModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  const assetId = Number(params.assetId);
  
  // Store hooks
  const { assets, updateAsset, isLoading } = useAssetStore();
  const { token } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState<UpdateAssetRequest>({
    name: '',
    balance: 0,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);

  useEffect(() => {
    // 자산 정보 로드
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setCurrentAsset(asset);
      setFormData({
        name: asset.name,
        balance: asset.balance,
        description: asset.description || '',
      });
      setLoading(false);
    } else {
      Alert.alert('오류', '자산 정보를 찾을 수 없습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    }
  }, [assetId, assets]);

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '자산 이름을 입력해주세요';
    }

    if (formData.balance < 0) {
      newErrors.balance = '잔액은 0 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 자산 수정 핸들러
  const handleSubmit = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!token) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await updateAsset(assetId, formData, token);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', '자산이 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', error.message || '자산 수정에 실패했습니다.');
    }
  };

  // 입력 필드 업데이트
  const updateField = (field: keyof UpdateAssetRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle">자산 수정</ThemedText>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.tint }
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <ThemedText style={styles.saveButtonText}>
            {isLoading ? '저장 중...' : '저장'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 자산 타입 표시 */}
          {currentAsset && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                자산 타입
              </ThemedText>
              <View style={[styles.typeDisplay, { backgroundColor: colors.card }]}>
                <ThemedText>{currentAsset.assetType}</ThemedText>
              </View>
            </View>
          )}

          {/* 자산 이름 */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              자산 이름 *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: errors.name ? '#F44336' : '#E0E0E0'
                }
              ]}
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="예: 주거래 통장, 비상금 등"
              placeholderTextColor={colors.tabIconDefault}
              autoCapitalize="none"
            />
            {errors.name && (
              <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
            )}
          </View>

          {/* 현재 잔액 */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              현재 잔액
            </ThemedText>
            <View style={styles.amountContainer}>
              <TextInput
                style={[
                  styles.amountInput,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.balance ? '#F44336' : '#E0E0E0'
                  }
                ]}
                value={formatAmountInput(formData.balance.toString())}
                onChangeText={(text) => {
                  const formattedText = formatAmountInput(text);
                  const numericValue = parseFormattedNumber(formattedText);
                  updateField('balance', numericValue);
                }}
                placeholder="0"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
              />
              {formData.balance > 0 && (
                <ThemedText style={[styles.amountInWords, { color: colors.icon }]}>
                  {formatKoreanAmount(formData.balance)}
                </ThemedText>
              )}
            </View>
            {errors.balance && (
              <ThemedText style={styles.errorText}>{errors.balance}</ThemedText>
            )}
          </View>

          {/* 설명 */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              설명 (선택)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: '#E0E0E0'
                }
              ]}
              value={formData.description || ''}
              onChangeText={(text) => updateField('description', text)}
              placeholder="자산에 대한 추가 설명을 입력하세요"
              placeholderTextColor={colors.tabIconDefault}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  content: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingVertical: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 4,
  },
  amountInWords: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  typeDisplay: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});