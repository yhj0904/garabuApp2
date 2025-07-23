import React from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface AssetDetailModalProps {
  visible: boolean;
  asset: any;
  assetType: any;
  recentTransactions: any[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatAmount: (amount: number) => string;
  formatDate: (date: string) => string;
}

export default function AssetDetailModal({
  visible,
  asset,
  assetType,
  recentTransactions,
  onClose,
  onEdit,
  onDelete,
  formatAmount,
  formatDate
}: AssetDetailModalProps) {
  const { colors } = useTheme();
  const router = useRouter();
  
  if (!asset) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle" weight="semibold">자산 상세</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 자산 정보 */}
            <View style={styles.assetDetailHeader}>
              <View style={[styles.assetDetailIcon, { backgroundColor: assetType?.color + '20' || '#007AFF20' }]}>
                <Ionicons name={assetType?.icon as any || 'card'} size={32} color={assetType?.color || '#007AFF'} />
              </View>
              <View style={styles.assetDetailInfo}>
                <ThemedText type="title" weight="bold">
                  {asset.name}
                </ThemedText>
                <ThemedText type="body" variant="secondary">
                  {assetType?.name} {asset.description && `• ${asset.description}`}
                </ThemedText>
              </View>
            </View>
            
            {/* 잔액 정보 */}
            <ThemedCard variant="elevated" style={styles.balanceCard}>
              <ThemedText type="caption" variant="secondary">현재 잔액</ThemedText>
              <ThemedText type="title" weight="bold" style={{ marginTop: 4 }}>
                ₩{formatAmount(asset.balance)}
              </ThemedText>
              {asset.interestRate && (
                <View style={styles.interestInfo}>
                  <Ionicons name="trending-up" size={16} color={colors.success} />
                  <ThemedText type="caption" variant="success" style={{ marginLeft: 4 }}>
                    연 {asset.interestRate}%
                  </ThemedText>
                </View>
              )}
            </ThemedCard>
            
            {/* 액션 버튼 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={onEdit}
              >
                <Ionicons name="pencil" size={20} color="white" />
                <ThemedText type="body" variant="inverse" weight="medium" style={{ marginLeft: 6 }}>
                  수정
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.error }]}
                onPress={onDelete}
              >
                <Ionicons name="trash" size={20} color="white" />
                <ThemedText type="body" variant="inverse" weight="medium" style={{ marginLeft: 6 }}>
                  삭제
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* 최근 거래 내역 */}
            <View style={styles.recentTransactions}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" weight="medium">최근 거래</ThemedText>
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: '/(tabs)/explore',
                      params: { assetId: asset.id }
                    });
                  }}
                >
                  <ThemedText type="caption" variant="primary">전체보기</ThemedText>
                </TouchableOpacity>
              </View>
              
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <ThemedText type="body">{transaction.description}</ThemedText>
                      <ThemedText type="caption" variant="tertiary">
                        {formatDate(transaction.transactionDate)}
                      </ThemedText>
                    </View>
                    <ThemedText 
                      type="body" 
                      weight="medium"
                      variant={transaction.amountType === 'INCOME' ? 'success' : 'error'}
                    >
                      {transaction.amountType === 'INCOME' ? '+' : '-'}₩{formatAmount(transaction.amount)}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText type="body" variant="tertiary" style={styles.emptyText}>
                  최근 거래 내역이 없습니다
                </ThemedText>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  assetDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  assetDetailIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  assetDetailInfo: {
    flex: 1,
  },
  balanceCard: {
    marginBottom: 20,
  },
  interestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  recentTransactions: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  transactionInfo: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
});