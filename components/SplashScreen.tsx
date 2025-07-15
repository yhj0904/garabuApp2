import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAssetStore } from '@/stores/assetStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { notification } from '@/services/notificationService';
import syncService from '@/services/syncService';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [statusMessage, setStatusMessage] = useState('앱을 준비하고 있습니다...');
  const [progress, setProgress] = useState(0);
  
  // Store hooks
  const { user, token, checkAuthStatus } = useAuthStore();
  const { fetchBooks, currentBook, fetchLedgers, fetchBookMembers } = useBookStore();
  const { fetchCategoriesByBook, fetchPaymentsByBook } = useCategoryStore();
  const { fetchAssetsByBook, fetchAssetTypes } = useAssetStore();
  const { getBudgetSummary } = useBudgetStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. 인증 상태 확인
      setStatusMessage('인증 상태 확인 중...');
      setProgress(10);
      await checkAuthStatus();
      
      // checkAuthStatus 후 토큰 다시 확인
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      
      // 토큰이 없으면 초기화 완료
      if (!currentToken) {
        setStatusMessage('로그인이 필요합니다');
        setProgress(100);
        setTimeout(onLoadingComplete, 500);
        return;
      }

      // 2. 사용자 정보가 있는 경우 데이터 로드
      if (currentUser && currentToken) {
        // 3. 가계부 목록 로드
        setStatusMessage('가계부 정보를 불러오는 중...');
        setProgress(20);
        const booksLoaded = await fetchBooks(currentToken);
        
        // 현재 가계부 다시 가져오기
        const currentBookState = useBookStore.getState().currentBook;
        
        if (booksLoaded && currentBookState) {
          // 4. 카테고리 및 결제수단 로드
          setStatusMessage('카테고리 정보를 불러오는 중...');
          setProgress(30);
          await Promise.all([
            fetchCategoriesByBook(currentBookState.id, currentToken),
            fetchPaymentsByBook(currentBookState.id, currentToken)
          ]);

          // 5. 가계부 멤버 정보 로드
          setStatusMessage('멤버 정보를 불러오는 중...');
          setProgress(40);
          await fetchBookMembers(currentBookState.id, currentToken);

          // 6. 최근 거래 내역 로드
          setStatusMessage('거래 내역을 불러오는 중...');
          setProgress(50);
          await fetchLedgers({
            bookId: currentBookState.id,
            page: 0,
            size: 20
          }, currentToken);

          // 7. 자산 정보 로드
          setStatusMessage('자산 정보를 불러오는 중...');
          setProgress(60);
          await Promise.all([
            fetchAssetTypes(currentToken),
            fetchAssetsByBook(currentBookState.id, currentToken)
          ]);

          // 8. 예산 정보 로드
          setStatusMessage('예산 정보를 불러오는 중...');
          setProgress(70);
          const currentMonth = new Date().toISOString().slice(0, 7);
          try {
            await getBudgetSummary(currentBookState.id, currentMonth, currentToken);
          } catch (error) {
            console.log('예산 정보 없음 (정상)');
          }

          // 9. 실시간 동기화 연결
          setStatusMessage('실시간 동기화 연결 중...');
          setProgress(80);
          if (currentUser.id) {
            try {
              await syncService.connect(currentUser.id, currentBookState.id, currentToken);
            } catch (error) {
              console.error('동기화 연결 실패:', error);
            }
          }

          // 10. 알림 서비스 초기화
          setStatusMessage('알림 서비스 초기화 중...');
          setProgress(90);
          try {
            const pushToken = await notification.registerForPushNotifications();
            if (pushToken && currentUser.id) {
              await notification.registerTokenWithServer(currentUser.id.toString(), pushToken);
              notification.registerNotificationListeners();
            }
          } catch (error) {
            console.error('알림 초기화 실패:', error);
          }
        }
      }

      // 11. 완료
      setStatusMessage('준비 완료!');
      setProgress(100);
      
      // 최소 표시 시간 보장 (부드러운 전환을 위해)
      setTimeout(onLoadingComplete, 500);
      
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      setStatusMessage('초기화 중 오류가 발생했습니다');
      setProgress(100);
      setTimeout(onLoadingComplete, 1000);
    }
  };

  const getStatusMessage = () => {
    if (progress === 100) {
      return statusMessage;
    }
    return `${statusMessage} (${progress}%)`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* 앱 로고 */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/GarabuLogo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Garabu</Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            당신의 일상을 더 스마트하게
          </Text>
        </View>

        {/* 로딩 인디케이터 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={styles.spinner}
          />
          <Text style={[styles.statusText, { color: colors.icon }]}>
            {getStatusMessage()}
          </Text>
          
          {/* 프로그레스 바 */}
          <View style={[styles.progressBar, { backgroundColor: colors.card }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.tint,
                  width: `${progress}%`
                }
              ]} 
            />
          </View>
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.icon }]}>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 60,
    width: '80%',
  },
  spinner: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 