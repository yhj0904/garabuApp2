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
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import type { CreateAssetRequest } from '@/services/api';

// 기본 자산 타입들 (서버에서 제공)
const DEFAULT_ASSET_TYPES = [
  { type: 'CASH', name: '현금', icon: 'cash', color: '#4CAF50' },
  { type: 'SAVINGS_ACCOUNT', name: '저축예금', icon: 'card', color: '#2196F3' },
  { type: 'CHECKING_ACCOUNT', name: '당좌예금', icon: 'card-outline', color: '#03A9F4' },
  { type: 'CREDIT_CARD', name: '신용카드', icon: 'card', color: '#FF9800' },
  { type: 'DEBIT_CARD', name: '체크카드', icon: 'card-outline', color: '#FF5722' },
] as const;

// 커스텀 자산 타입들
const CUSTOM_ASSET_TYPES = [
  { type: 'INVESTMENT', name: '투자자산', icon: 'trending-up', color: '#9C27B0' },
  { type: 'REAL_ESTATE', name: '부동산', icon: 'home', color: '#795548' },
  { type: 'OTHER', name: '기타', icon: 'diamond', color: '#607D8B' },
] as const;

export default function AddAssetModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
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

    if ((formData.assetType === 'SAVINGS_ACCOUNT' || formData.assetType === 'CHECKING_ACCOUNT') && !formData.bankName?.trim()) {
      newErrors.bankName = '은행명을 입력해주세요';
    }

    if ((formData.assetType === 'CREDIT_CARD' || formData.assetType === 'DEBIT_CARD') && !formData.cardType?.trim()) {
      newErrors.cardType = '카드 타입을 입력해주세요';
    }

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

  const selectedAssetType = [...DEFAULT_ASSET_TYPES, ...CUSTOM_ASSET_TYPES].find(type => type.type === formData.assetType);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 자산 타입 선택 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            자산 타입
          </ThemedText>
          {/* 기본 자산 타입들 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            기본 자산
          </ThemedText>
          <View style={styles.assetTypeGrid}>
            {DEFAULT_ASSET_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.assetTypeButton,
                  { backgroundColor: colors.card },
                  formData.assetType === type.type && [
                    styles.selectedAssetType,
                    { borderColor: type.color }
                  ]
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

          {/* 커스텀 자산 타입들 */}
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            추가 자산
          </ThemedText>
          <View style={styles.assetTypeGrid}>
            {CUSTOM_ASSET_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.assetTypeButton,
                  { backgroundColor: colors.card },
                  formData.assetType === type.type && [
                    styles.selectedAssetType,
                    { borderColor: type.color }
                  ]
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
            <ThemedText style={styles.errorText}>{errors.assetType}</ThemedText>
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

        {/* 초기 잔액 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            초기 잔액
          </ThemedText>
          <TextInput
                            style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.balance ? '#F44336' : '#E0E0E0'
                  }
                ]}
            value={formData.balance.toString()}
            onChangeText={(text) => {
              const numericValue = parseInt(text.replace(/[^0-9]/g, '')) || 0;
              updateField('balance', numericValue);
            }}
            placeholder="0"
            placeholderTextColor={colors.tabIconDefault}
            keyboardType="numeric"
          />
          {errors.balance && (
            <ThemedText style={styles.errorText}>{errors.balance}</ThemedText>
          )}
        </View>

        {/* 은행 계좌 추가 정보 */}
        {(formData.assetType === 'SAVINGS_ACCOUNT' || formData.assetType === 'CHECKING_ACCOUNT') && (
          <>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                은행명 *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.bankName ? '#F44336' : '#E0E0E0'
                  }
                ]}
                value={formData.bankName || ''}
                onChangeText={(text) => updateField('bankName', text)}
                placeholder="예: 국민은행, 신한은행"
                placeholderTextColor={colors.tabIconDefault}
              />
              {errors.bankName && (
                <ThemedText style={styles.errorText}>{errors.bankName}</ThemedText>
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
                    borderColor: '#E0E0E0'
                  }
                ]}
                value={formData.accountNumber || ''}
                onChangeText={(text) => updateField('accountNumber', text)}
                placeholder="계좌번호 (마지막 4자리만)"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        {/* 카드 추가 정보 */}
        {(formData.assetType === 'CREDIT_CARD' || formData.assetType === 'DEBIT_CARD') && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              카드 타입 *
            </ThemedText>
            <TextInput
                              style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.cardType ? '#F44336' : '#E0E0E0'
                  }
                ]}
              value={formData.cardType || ''}
              onChangeText={(text) => updateField('cardType', text)}
              placeholder="예: 신용카드, 체크카드, 교통카드"
              placeholderTextColor={colors.tabIconDefault}
            />
            {errors.cardType && (
              <ThemedText style={styles.errorText}>{errors.cardType}</ThemedText>
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
                borderColor: colors.border
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

        {/* 미리보기 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            미리보기
          </ThemedText>
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
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
                <ThemedText style={styles.previewType}>
                  {selectedAssetType?.name}
                </ThemedText>
              </View>
              <ThemedText type="defaultSemiBold">
                ₩{formData.balance.toLocaleString()}
              </ThemedText>
            </View>
            {formData.description && (
              <ThemedText style={styles.previewDescription}>
                {formData.description}
              </ThemedText>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
    color: '#F44336',
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
    borderColor: 'transparent',
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
    shadowColor: '#000',
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
    color: '#8E8E93',
    marginTop: 2,
  },
  previewDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});