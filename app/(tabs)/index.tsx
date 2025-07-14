import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { notification } from '@/services/notificationService';
import syncService from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Ledger } from '@/services/api';

export default function HomeScreen() {
  const { user, token, logout } = useAuthStore();
  const { books, currentBook, ledgers, bookMembers, fetchBooks, fetchLedgers, fetchBookMembers } = useBookStore();
  const { fetchCategories, fetchPayments, fetchCategoriesByBook, fetchPaymentsByBook } = useCategoryStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  // 새로고침 핸들러
  const onRefresh = async () => {
    try {
      // 햅틱 피드백
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setRefreshing(true);
      
      if (token) {
        // 모든 데이터 다시 불러오기
        await fetchBooks(token);
        
        // 현재 가계부의 카테고리와 결제수단 다시 로드
        if (currentBook) {
          await Promise.all([
            fetchCategoriesByBook(currentBook.id, token),
            fetchPaymentsByBook(currentBook.id, token)
          ]);
        }
        
        // 현재 가계부의 최근 거래 내역 다시 로드
        if (currentBook) {
          await fetchLedgers({
            bookId: currentBook.id,
            page: 0,
            size: 5
          }, token);
        }
        
        // 동기화 수행
                  await syncService.forceSync();
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      Alert.alert('새로고침 실패', '데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (token) {
      fetchBooks(token);
      
      // 알림 서비스 초기화
      initializeNotifications();
    }
  }, [token]);

  // 현재 가계부 변경 시 해당 가계부의 카테고리와 결제수단 로드
  useEffect(() => {
    if (token && currentBook && currentBook.id) {
      console.log('가계부별 카테고리/결제수단 조회 시작:', currentBook.id);
      fetchCategoriesByBook(currentBook.id, token);
      fetchPaymentsByBook(currentBook.id, token);
    }
  }, [token, currentBook]);

  // 현재 가계부의 최근 거래 내역 로드
  useEffect(() => {
    if (token && currentBook && currentBook.id) {
      console.log('가계부 기록 조회 시작:', currentBook.id);
      fetchLedgers({
        bookId: currentBook.id,
        page: 0,
        size: 5
      }, token);
      
      // 실시간 동기화 연결
      if (user?.id) {
        syncService.connect(user.id, currentBook.id, token);
      }
    } else {
      console.log('가계부 기록 조회 건너뜀:', { 
        token: !!token, 
        currentBook: !!currentBook, 
        currentBookId: currentBook?.id 
      });
    }
  }, [token, currentBook, user]);

  // 실시간 동기화 이벤트 리스너
  useEffect(() => {
    const handleLedgerCreated = (ledger: any) => {
      console.log('New ledger created:', ledger);
      // 거래 목록 새로고침
      if (token && currentBook) {
        fetchLedgers({ bookId: currentBook.id, page: 0, size: 5 }, token);
      }
    };

    const handleSyncStatusChanged = (status: any) => {
      console.log('Sync status changed:', status);
      // 동기화 상태 UI 업데이트
    };

    syncService.on('ledger-created', handleLedgerCreated);
    syncService.on('sync-status-changed', handleSyncStatusChanged);

    return () => {
      syncService.off('ledger-created', handleLedgerCreated);
      syncService.off('sync-status-changed', handleSyncStatusChanged);
    };
  }, [token]);

  // 알림 서비스 초기화
  const initializeNotifications = async () => {
    try {
      const token = await notification.registerForPushNotifications();
      if (token && user?.id) {
        await notification.registerTokenWithServer(user.id.toString(), token);
      }
      
      // 알림 리스너 등록
      notification.registerNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      syncService.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const openModal = () => {
    router.push('/(modals)/' as any);
  };

  // 잔액 계산
  const calculateBalance = () => {
    return ledgers.reduce((total, ledger) => {
      return ledger.amountType === 'INCOME' 
        ? total + ledger.amount 
        : total - ledger.amount;
    }, 0);
  };

  // 이번 달 변동량 계산
  const calculateMonthlyChange = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthLedgers = ledgers.filter(ledger => {
      const ledgerDate = new Date(ledger.date);
      return ledgerDate.getMonth() === currentMonth && 
             ledgerDate.getFullYear() === currentYear;
    });
    
    return thisMonthLedgers.reduce((total, ledger) => {
      return ledger.amountType === 'INCOME' 
        ? total + ledger.amount 
        : total - ledger.amount;
    }, 0);
  };

  // 거래 내역 아이콘 매핑
  const getTransactionIcon = (description: string) => {
    const lowercaseDesc = description.toLowerCase();
    if (lowercaseDesc.includes('식') || lowercaseDesc.includes('음식')) return 'restaurant';
    if (lowercaseDesc.includes('급여') || lowercaseDesc.includes('월급')) return 'card';
    if (lowercaseDesc.includes('주유') || lowercaseDesc.includes('기름')) return 'car';
    if (lowercaseDesc.includes('교통') || lowercaseDesc.includes('지하철')) return 'train';
    if (lowercaseDesc.includes('쇼핑') || lowercaseDesc.includes('구매')) return 'bag';
    return 'wallet';
  };

  // 거래 내역 아이콘 색상 매핑
  const getTransactionColor = (description: string) => {
    const lowercaseDesc = description.toLowerCase();
    if (lowercaseDesc.includes('식') || lowercaseDesc.includes('음식')) return '#FF9500';
    if (lowercaseDesc.includes('급여') || lowercaseDesc.includes('월급')) return '#007AFF';
    if (lowercaseDesc.includes('주유') || lowercaseDesc.includes('기름')) return '#5856D6';
    if (lowercaseDesc.includes('교통') || lowercaseDesc.includes('지하철')) return '#FF3B30';
    if (lowercaseDesc.includes('쇼핑') || lowercaseDesc.includes('구매')) return '#AF52DE';
    return colors.tint;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays - 1}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const balance = calculateBalance();
  const monthlyChange = calculateMonthlyChange();

  return (
    <ThemedView style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
              progressBackgroundColor={colors.background}
            />
          }
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <ThemedText type="title">안녕하세요!</ThemedText>
              <ThemedText type="subtitle">{user?.name || user?.username || '사용자'}님</ThemedText>
              {currentBook && (
                <ThemedText style={styles.bookName}>{currentBook.title}</ThemedText>
              )}
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={openModal}>
              <Ionicons name="person-circle" size={40} color={colors.tint} />
            </TouchableOpacity>
          </View>

          {/* 잔액 카드 */}
          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <View style={styles.balanceHeader}>
              <ThemedText type="subtitle">현재 잔액</ThemedText>
              <Ionicons name="wallet" size={24} color={colors.tint} />
            </View>
            <ThemedText type="title" style={styles.balanceAmount}>
              ₩{formatAmount(balance)}
            </ThemedText>
            <View style={styles.balanceChange}>
              <Ionicons 
                name={monthlyChange >= 0 ? "trending-up" : "trending-down"} 
                size={16} 
                color={monthlyChange >= 0 ? "#4CAF50" : "#FF3B30"} 
              />
              <ThemedText style={[styles.changeText, { color: monthlyChange >= 0 ? "#4CAF50" : "#FF3B30" }]}>
                {monthlyChange >= 0 ? '+' : ''}₩{formatAmount(monthlyChange)} 이번 달
              </ThemedText>
            </View>
          </View>

          {/* 빠른 액션 버튼들 */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/add-transaction')}
            >
              <Ionicons name="add-circle" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">수입 추가</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/add-transaction')}
            >
              <Ionicons name="remove-circle" size={32} color="#FF3B30" />
              <ThemedText type="defaultSemiBold">지출 추가</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/advanced-stats')}
            >
              <Ionicons name="analytics" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">통계 보기</ThemedText>
            </TouchableOpacity>
          </View>

          {/* 추가 기능 버튼들 */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/select-book')}
            >
              <Ionicons name="book" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">가계부 선택</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={async () => {
                if (currentBook && currentBook.id) {
                  try {
                    console.log('가계부 설정 버튼 클릭:', { currentBook });
                    
                    // 현재 가계부의 멤버 정보 가져오기
                    let members = bookMembers;
                    if (token) {
                      const success = await fetchBookMembers(currentBook.id, token);
                      if (success) {
                        // fetchBookMembers가 성공하면 store에서 다시 가져오기
                        members = useBookStore.getState().bookMembers;
                      }
                    }
                    
                    // 현재 사용자의 역할 찾기
                    const currentUserMember = members.find(member => member.memberId === user?.id);
                    const userRole = currentUserMember?.role || 'VIEWER';
                    
                    console.log('가계부 설정 열기:', {
                      bookId: currentBook.id,
                      bookTitle: currentBook.title,
                      userRole: userRole,
                      members: members,
                      currentUser: user?.id
                    });
                    
                    router.push({
                      pathname: '/(modals)/settings',
                      params: { 
                        bookId: currentBook.id.toString(), 
                        bookTitle: currentBook.title,
                        userRole: userRole
                      }
                    });
                  } catch (error) {
                    console.error('가계부 설정 열기 실패:', error);
                    Alert.alert('오류', '가계부 설정을 불러올 수 없습니다.');
                  }
                } else {
                  Alert.alert('알림', '먼저 가계부를 선택해주세요.');
                }
              }}
            >
              <Ionicons name="settings" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">가계부 설정</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/add-book')}
            >
              <Ionicons name="add" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">가계부 추가</ThemedText>
            </TouchableOpacity>
          </View>

          {/* 관리 기능 버튼들 - 한 줄에 3개씩 */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/add-category')}
            >
              <Ionicons name="pricetag" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">카테고리</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/book-sharing')}
            >
              <Ionicons name="people" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">공유 관리</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => {
                // 예산 초과 알림 테스트
                const currentExpense = ledgers
                  .filter(l => l.amountType === 'EXPENSE')
                  .reduce((sum, l) => sum + l.amount, 0);
                
                if (currentExpense > 2000000) {
                  notification.sendBudgetAlert(user?.id?.toString() || '1', currentExpense, 2000000);
                }
              }}
            >
              <Ionicons name="notifications" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">알림 설정</ThemedText>
            </TouchableOpacity>
          </View>

          {/* 동기화 버튼 */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => {
                // 동기화 상태 확인
                const syncStatus = syncService.getSyncStatus();
                Alert.alert(
                  '동기화 상태',
                  `연결 상태: ${syncStatus.isConnected ? '연결됨' : '연결 안됨'}\n` +
                  `마지막 동기화: ${new Date(syncStatus.lastSyncTime).toLocaleString()}\n` +
                  `대기 중인 변경사항: ${syncStatus.pendingChanges}개`,
                  [
                    { text: '확인', style: 'default' },
                    { text: '재동기화', onPress: () => syncService.forceSync() }
                  ]
                );
              }}
            >
              <Ionicons name="sync" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">동기화</ThemedText>
            </TouchableOpacity>
          </View>

          {/* 최근 거래 내역 */}
          <View style={styles.recentTransactions}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">최근 거래</ThemedText>
              <TouchableOpacity onPress={() => {
                router.push('/(tabs)/explore');
                // 내역 탭으로 이동하도록 설정할 수 있지만, 현재는 탭 상태가 전역이 아니므로 생략
              }}>
                <ThemedText style={[styles.seeAllText, { color: colors.tint }]}>
                  모두 보기
                </ThemedText>
              </TouchableOpacity>
            </View>

            {ledgers.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Ionicons name="receipt-outline" size={48} color={colors.icon} />
                <ThemedText style={styles.emptyStateText}>거래 내역이 없습니다</ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>첫 거래를 추가해보세요!</ThemedText>
              </View>
            ) : (
              ledgers.slice(0, 3).map((ledger) => (
                <View key={ledger.id} style={[styles.transactionItem, { backgroundColor: colors.card }]}>
                  <View style={styles.transactionIcon}>
                    <Ionicons 
                      name={getTransactionIcon(ledger.description) as any} 
                      size={24} 
                      color={getTransactionColor(ledger.description)} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <ThemedText type="defaultSemiBold">{ledger.description}</ThemedText>
                    <ThemedText style={styles.transactionDate}>
                      {formatDate(ledger.date)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[
                    styles.transactionAmount, 
                    { color: ledger.amountType === 'INCOME' ? '#4CAF50' : '#FF3B30' }
                  ]}>
                    {ledger.amountType === 'INCOME' ? '+' : '-'}₩{formatAmount(ledger.amount)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>

          {/* 로그아웃 버튼 */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="white" />
            <ThemedText style={styles.logoutButtonText}>로그아웃</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  userInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentTransactions: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
}); 