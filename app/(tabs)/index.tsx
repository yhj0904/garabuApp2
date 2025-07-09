import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <ThemedText type="title">안녕하세요!</ThemedText>
              <ThemedText type="subtitle">{user?.username || '사용자'}님</ThemedText>
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
              ₩1,250,000
            </ThemedText>
            <View style={styles.balanceChange}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
              <ThemedText style={[styles.changeText, { color: '#4CAF50' }]}>
                +₩45,000 이번 달
              </ThemedText>
            </View>
          </View>

          {/* 빠른 액션 버튼들 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="add-circle" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">수입 추가</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="remove-circle" size={32} color="#FF3B30" />
              <ThemedText type="defaultSemiBold">지출 추가</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="analytics" size={32} color={colors.tint} />
              <ThemedText type="defaultSemiBold">통계 보기</ThemedText>
            </TouchableOpacity>
          </View>

          {/* 최근 거래 내역 */}
          <View style={styles.recentTransactions}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">최근 거래</ThemedText>
              <TouchableOpacity>
                <ThemedText style={[styles.seeAllText, { color: colors.tint }]}>
                  모두 보기
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
              <View style={styles.transactionIcon}>
                <Ionicons name="restaurant" size={24} color="#FF9500" />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText type="defaultSemiBold">점심 식사</ThemedText>
                <ThemedText style={styles.transactionDate}>오늘 12:30</ThemedText>
              </View>
              <ThemedText style={[styles.transactionAmount, { color: '#FF3B30' }]}>
                -₩12,000
              </ThemedText>
            </View>

            <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
              <View style={styles.transactionIcon}>
                <Ionicons name="card" size={24} color="#007AFF" />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText type="defaultSemiBold">월급</ThemedText>
                <ThemedText style={styles.transactionDate}>어제 09:00</ThemedText>
              </View>
              <ThemedText style={[styles.transactionAmount, { color: '#4CAF50' }]}>
                +₩3,500,000
              </ThemedText>
            </View>

            <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
              <View style={styles.transactionIcon}>
                <Ionicons name="car" size={24} color="#5856D6" />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText type="defaultSemiBold">주유</ThemedText>
                <ThemedText style={styles.transactionDate}>2일 전 18:20</ThemedText>
              </View>
              <ThemedText style={[styles.transactionAmount, { color: '#FF3B30' }]}>
                -₩65,000
              </ThemedText>
            </View>
          </View>

          {/* 로그아웃 버튼 */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="white" />
            <ThemedText style={styles.logoutButtonText}>로그아웃</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
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
}); 