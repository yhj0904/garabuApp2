import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import type { Asset, UpdateAssetRequest } from '@/services/api';

export default function AssetDetailModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  
  // Store hooks
  const { 
    assets, 
    assetTypes, 
    updateAsset, 
    deleteAsset, 
    updateAssetBalance,
    fetchAssetsByBook,
    isLoading 
  } = useAssetStore();
  const { token } = useAuthStore();
  const { currentBook } = useBookStore();

  // State
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [refreshing, setRefreshing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateAssetRequest>({
    name: '',
    description: '',
    accountNumber: '',
    bankName: '',
    cardType: '',
  });

  // 자산 찾기 및 상태 설정
  useEffect(() => {
    if (assetId) {
      const foundAsset = assets.find(a => a.id === parseInt(assetId));
      if (foundAsset) {
        setAsset(foundAsset);
        setEditForm({
          name: foundAsset.name,
          description: foundAsset.description || '',
          accountNumber: foundAsset.accountNumber || '',
          bankName: foundAsset.bankName || '',
          cardType: foundAsset.cardType || '',
        });
      }
    }
  }, [assetId, assets]);

  // 새로고침
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (currentBook && token) {
        await fetchAssetsByBook(currentBook.id, token);
      }
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 자산 정보 수정
  const handleSaveEdit = async () => {
    if (!asset || !token) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await updateAsset(asset.id, editForm, token);
      setIsEditing(false);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', '자산 정보가 수정되었습니다.');
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', error.message || '자산 수정에 실패했습니다.');
    }
  };

  // 자산 삭제
  const handleDelete = async () => {
    if (!asset || !token) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      await deleteAsset(asset.id, token);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('삭제 완료', '자산이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', error.message || '자산 삭제에 실패했습니다.');
    }
  };

  // 잔액 수정
  const handleBalanceUpdate = async () => {
    if (!asset || !token || !balanceAmount.trim()) return;

    const amount = parseFloat(balanceAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await updateAssetBalance(asset.id, Math.floor(amount), balanceOperation, token);
      setShowBalanceModal(false);
      setBalanceAmount('');
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', '잔액이 업데이트되었습니다.');
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', error.message || '잔액 업데이트에 실패했습니다.');
    }
  };

  if (!asset) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">자산 상세</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ThemedText>자산을 찾을 수 없습니다.</ThemedText>
        </View>
      </View>
    );
  }

  const assetType = assetTypes.find(type => type.type === asset.assetType);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle">자산 상세</ThemedText>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          disabled={isLoading}
        >
          <Ionicons 
            name={isEditing ? "close" : "create"} 
            size={24} 
            color={colors.tint} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {/* 자산 헤더 카드 */}
        <View style={[styles.assetHeaderCard, { backgroundColor: colors.card }]}>
          <View style={styles.assetHeaderTop}>
            <View style={[styles.assetTypeIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
              <Ionicons name={assetType?.icon as any || 'card'} size={32} color="white" />
            </View>
            <View style={styles.assetHeaderInfo}>
              {isEditing ? (
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="자산 이름"
                  placeholderTextColor={colors.tabIconDefault}
                />
              ) : (
                <ThemedText type="title">{asset.name}</ThemedText>
              )}
              <ThemedText style={[styles.assetTypeText, { color: colors.tabIconDefault }]}>
                {assetType?.name}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.balanceSection}>
            <ThemedText style={[styles.balanceLabel, { color: colors.tabIconDefault }]}>
              현재 잔액
            </ThemedText>
            <ThemedText type="title" style={[styles.balanceAmount, { color: colors.text }]}>
              ₩{asset.balance.toLocaleString()}
            </ThemedText>
            <TouchableOpacity 
              style={[styles.balanceButton, { backgroundColor: colors.tint }]}
              onPress={() => setShowBalanceModal(true)}
            >
              <Ionicons name="pencil" size={16} color="white" />
              <ThemedText style={styles.balanceButtonText}>잔액 수정</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 상세 정보 */}
        <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>상세 정보</ThemedText>
          
          {/* 설명 */}
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
              설명
            </ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.editTextArea, { 
                  color: colors.text, 
                  borderColor: colors.border,
                  backgroundColor: colors.background 
                }]}
                value={editForm.description}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                placeholder="자산 설명"
                placeholderTextColor={colors.tabIconDefault}
                multiline
                numberOfLines={3}
              />
            ) : (
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {asset.description || '설명 없음'}
              </ThemedText>
            )}
          </View>

          {/* 은행 관련 정보 */}
          {(asset.assetType === 'SAVINGS_ACCOUNT' || asset.assetType === 'CHECKING_ACCOUNT') && (
            <>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
                  은행명
                </ThemedText>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                    value={editForm.bankName}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, bankName: text }))}
                    placeholder="은행명"
                    placeholderTextColor={colors.tabIconDefault}
                  />
                ) : (
                  <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                    {asset.bankName || '미설정'}
                  </ThemedText>
                )}
              </View>
              
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
                  계좌번호
                </ThemedText>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                    value={editForm.accountNumber}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, accountNumber: text }))}
                    placeholder="계좌번호"
                    placeholderTextColor={colors.tabIconDefault}
                  />
                ) : (
                  <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                    {asset.accountNumber || '미설정'}
                  </ThemedText>
                )}
              </View>
            </>
          )}

          {/* 카드 관련 정보 */}
          {(asset.assetType === 'CREDIT_CARD' || asset.assetType === 'DEBIT_CARD') && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
                카드 타입
              </ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                  value={editForm.cardType}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, cardType: text }))}
                  placeholder="카드 타입"
                  placeholderTextColor={colors.tabIconDefault}
                />
              ) : (
                <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                  {asset.cardType || '미설정'}
                </ThemedText>
              )}
            </View>
          )}

          {/* 생성일/수정일 */}
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
              생성일
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.text }]}>
              {new Date(asset.createdAt).toLocaleDateString('ko-KR')}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
              수정일
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.text }]}>
              {new Date(asset.updatedAt).toLocaleDateString('ko-KR')}
            </ThemedText>
          </View>
        </View>

        {/* 액션 버튼 */}
        {isEditing ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSaveEdit}
              disabled={isLoading}
            >
              <Ionicons name="save" size={20} color="white" />
              <ThemedText style={styles.saveButtonText}>
                {isLoading ? '저장 중...' : '저장'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setIsEditing(false)}
            >
              <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
                취소
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons name="trash" size={20} color="white" />
              <ThemedText style={styles.deleteButtonText}>자산 삭제</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 삭제 확인 모달 */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle" style={styles.deleteModalTitle}>
              자산 삭제
            </ThemedText>
            <ThemedText style={[styles.deleteModalText, { color: colors.tabIconDefault }]}>
              '{asset.name}' 자산을 삭제하시겠습니까?
              {'\n'}삭제된 자산은 복구할 수 없습니다.
            </ThemedText>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, { backgroundColor: colors.card }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <ThemedText style={[styles.deleteModalButtonText, { color: colors.text }]}>
                  취소
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteModalButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
              >
                <ThemedText style={[styles.deleteModalButtonText, { color: 'white' }]}>
                  삭제
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 잔액 수정 모달 */}
      <Modal
        visible={showBalanceModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.balanceModal, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle" style={styles.balanceModalTitle}>
              잔액 수정
            </ThemedText>
            
            {/* 타입 선택 */}
            <View style={styles.balanceTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.balanceTypeButton,
                  { backgroundColor: balanceOperation === 'ADD' ? '#4CAF50' : colors.card }
                ]}
                onPress={() => setBalanceOperation('ADD')}
              >
                <Ionicons 
                  name="add-circle" 
                  size={20} 
                  color={balanceOperation === 'ADD' ? 'white' : colors.text} 
                />
                <ThemedText style={[
                  styles.balanceTypeText,
                  { color: balanceOperation === 'ADD' ? 'white' : colors.text }
                ]}>
                  추가
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.balanceTypeButton,
                  { backgroundColor: balanceOperation === 'SUBTRACT' ? '#FF3B30' : colors.card }
                ]}
                onPress={() => setBalanceOperation('SUBTRACT')}
              >
                <Ionicons 
                  name="remove-circle" 
                  size={20} 
                  color={balanceOperation === 'SUBTRACT' ? 'white' : colors.text} 
                />
                <ThemedText style={[
                  styles.balanceTypeText,
                  { color: balanceOperation === 'SUBTRACT' ? 'white' : colors.text }
                ]}>
                  차감
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* 금액 입력 */}
            <View style={styles.balanceInputContainer}>
              <ThemedText style={[styles.balanceInputLabel, { color: colors.tabIconDefault }]}>
                금액
              </ThemedText>
              <TextInput
                style={[styles.balanceInput, { 
                  color: colors.text, 
                  borderColor: colors.border,
                  backgroundColor: colors.card 
                }]}
                value={balanceAmount}
                onChangeText={setBalanceAmount}
                placeholder="0"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.balanceModalButtons}>
              <TouchableOpacity
                style={[styles.balanceModalButton, { backgroundColor: colors.card }]}
                onPress={() => {
                  setShowBalanceModal(false);
                  setBalanceAmount('');
                }}
              >
                <ThemedText style={[styles.balanceModalButtonText, { color: colors.text }]}>
                  취소
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.balanceModalButton, { backgroundColor: colors.tint }]}
                onPress={handleBalanceUpdate}
              >
                <ThemedText style={[styles.balanceModalButtonText, { color: 'white' }]}>
                  확인
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  assetHeaderCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  assetHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  assetTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  assetHeaderInfo: {
    flex: 1,
  },
  assetTypeText: {
    fontSize: 14,
    marginTop: 4,
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  balanceButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  detailCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  editInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  editTextArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModal: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteModalTitle: {
    marginBottom: 16,
  },
  deleteModalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceModal: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
  },
  balanceModalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  balanceTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  balanceTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  balanceTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceInputContainer: {
    marginBottom: 24,
  },
  balanceInputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  balanceModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});