import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import type { CreateAssetRequest } from '@/core/api/client';
import { formatAmountInput, parseFormattedNumber, formatKoreanAmount } from '@/utils/numberFormat';

// 주요 자산 타입들 (색상은 컴포넌트 내부에서 정의)

export default function AddAssetModal() {
  const { colors } = useTheme();
  
  // 주요 자산 타입들
  const MAIN_ASSET_TYPES = [
    { type: 'CASH', name: '현금', icon: 'cash', color: colors.success },
    { type: 'SAVINGS_ACCOUNT', name: '은행계좌', icon: 'card', color: colors.info },
    { type: 'CREDIT_CARD', name: '카드', icon: 'card', color: colors.warning },
    { type: 'INVESTMENT', name: '투자', icon: 'trending-up', color: colors.transfer },
  ] as const;
  
  // Store hooks
  const { createAsset, isLoading } = useAssetStore();
  const { token } = useAuthStore();
  const { currentBook } = useBookStore();

  // Form state
  const [formData, setFormData] = useState<CreateAssetRequest>({
    name: '',
    assetType: 'CASH',
    balance: 0,
    description: '',
    accountNumber: '',
    bankName: '',
    cardType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '자산 이름을 입력해주세요';
    }

    if (formData.balance < 0) {
      newErrors.balance = '잔액은 0 이상이어야 합니다';
    }

    // 은행계좌는 은행명이 선택사항
    // 카드는 카드사가 선택사항

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 자산 생성 핸들러
  const handleSubmit = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!currentBook || !token) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await createAsset(currentBook.id, formData, token);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', '자산이 추가되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', error.message || '자산 추가에 실패했습니다.');
    }
  };

  // 자산 타입 선택 핸들러
  const handleAssetTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, assetType: type as any }));
    setErrors(prev => ({ ...prev, assetType: '' }));
    Haptics.selectionAsync();
  };

  // 입력 필드 업데이트
  const updateField = (field: keyof CreateAssetRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedAssetType = MAIN_ASSET_TYPES.find(type => type.type === formData.assetType);

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
        <ThemedText type="subtitle">자산 추가</ThemedText>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary }
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
        {/* 자산 타입 선택 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            자산 타입을 선택하세요
          </ThemedText>
          <View style={styles.assetTypeGrid}>
            {MAIN_ASSET_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.assetTypeButton,
                  { 
                    backgroundColor: colors.card,
                    borderColor: formData.assetType === type.type ? type.color : 'transparent'
                  },
                  formData.assetType === type.type && styles.selectedAssetType
                ]}
                onPress={() => handleAssetTypeSelect(type.type)}
              >
                <View style={[styles.assetTypeIcon, { backgroundColor: type.color }]}>
                  <Ionicons name={type.icon as any} size={24} color="white" />
                </View>
                <ThemedText style={styles.assetTypeName}>{type.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          {errors.assetType && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.assetType}</ThemedText>
          )}
        </View>

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
                    borderColor: errors.name ? colors.error : colors.border
                  }
                ]}
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="예: 주거래 통장, 비상금 등"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
          />
          {errors.name && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.name}</ThemedText>
          )}
        </View>

        {/* 초기 잔액 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            초기 잔액
          </ThemedText>
          <View style={styles.amountContainer}>
            <TextInput
              style={[
                styles.amountInput,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: errors.balance ? colors.error : colors.border
                }
              ]}
              value={formatAmountInput(formData.balance.toString())}
              onChangeText={(text) => {
                const formattedText = formatAmountInput(text);
                const numericValue = parseFormattedNumber(formattedText);
                updateField('balance', numericValue);
              }}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            {formData.balance > 0 && (
              <ThemedText style={[styles.amountInWords, { color: colors.textTertiary }]}>
                {formatKoreanAmount(formData.balance)}
              </ThemedText>
            )}
          </View>
          {errors.balance && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.balance}</ThemedText>
          )}
        </View>

        {/* 은행 계좌 추가 정보 */}
        {formData.assetType === 'SAVINGS_ACCOUNT' && (
          <>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                은행명
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.bankName ? colors.error : colors.border
                  }
                ]}
                value={formData.bankName || ''}
                onChangeText={(text) => updateField('bankName', text)}
                placeholder="예: 국민은행, 신한은행"
                placeholderTextColor={colors.textTertiary}
              />
              {errors.bankName && (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.bankName}</ThemedText>
              )}
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                계좌번호 (선택)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.accountNumber || ''}
                onChangeText={(text) => updateField('accountNumber', text)}
                placeholder="메모용 (예: 1234)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        {/* 카드 추가 정보 */}
        {formData.assetType === 'CREDIT_CARD' && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              카드사
            </ThemedText>
            <TextInput
                              style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.cardType ? colors.error : colors.border
                  }
                ]}
              value={formData.cardType || ''}
              onChangeText={(text) => updateField('cardType', text)}
              placeholder="예: 삼성카드, 현대카드"
              placeholderTextColor={colors.textTertiary}
            />
            {errors.cardType && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.cardType}</ThemedText>
            )}
          </View>
        )}

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
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 미리보기 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            미리보기
          </ThemedText>
          <View style={[styles.previewCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewIcon, { backgroundColor: selectedAssetType?.color }]}>
                <Ionicons 
                  name={selectedAssetType?.icon as any} 
                  size={24} 
                  color="white" 
                />
              </View>
              <View style={styles.previewInfo}>
                <ThemedText type="defaultSemiBold">
                  {formData.name || '자산 이름'}
                </ThemedText>
                <ThemedText style={[styles.previewType, { color: colors.textSecondary }]}>
                  {selectedAssetType?.name}
                </ThemedText>
              </View>
              <ThemedText type="defaultSemiBold">
                ₩{formData.balance.toLocaleString()}
              </ThemedText>
            </View>
            {formData.description && (
              <ThemedText style={[styles.previewDescription, { color: colors.textSecondary }]}>
                {formData.description}
              </ThemedText>
            )}
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
  sectionTitle: {
    marginBottom: 16,
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
    fontSize: 12,
    marginTop: 4,
  },
  assetTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  assetTypeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  selectedAssetType: {
    borderWidth: 2,
  },
  assetTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  assetTypeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewType: {
    fontSize: 12,
    marginTop: 2,
  },
  previewDescription: {
    fontSize: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
});