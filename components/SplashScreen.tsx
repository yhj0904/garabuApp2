import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAssetStore } from '@/stores/assetStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { notification } from '@/core/notifications/local';
import syncService from '@/services/syncService';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const { colors } = useTheme();
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
    // 전체 초기화에 대한 타임아웃 설정 (10초로 단축)
    const timeout = setTimeout(async () => {
      console.error('앱 초기화 타임아웃');
      setStatusMessage('초기화가 완료되었습니다');
      setProgress(100);
      // 타임아웃 시에도 로딩 완료 처리
      onLoadingComplete();
    }, 10000);

    try {
      // 1. 인증 상태 확인 (타임아웃 더욱 단축)
      setStatusMessage('인증 상태 확인 중...');
      setProgress(10);
      
      // 인증 상태 확인에 타임아웃 추가 (7초로 증가)
      const authPromise = checkAuthStatus();
      const authTimeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 7000)
      );
      
      try {
        await Promise.race([authPromise, authTimeoutPromise]);
      } catch (authError: any) {
        if (authError.message === 'AUTH_TIMEOUT') {
          console.error('인증 상태 확인 타임아웃');
          setStatusMessage('서버 연결 지연 - 오프라인 모드 확인 중...');
          setProgress(50);
          
          // 타임아웃 발생 시 로컬 토큰만 확인하고 바로 진행
          try {
            const localToken = await AsyncStorage.getItem('auth-token');
            const savedUserData = await AsyncStorage.getItem('user-data');
            
            if (localToken && savedUserData) {
              console.log('로컬 데이터로 오프라인 모드 시작');
              setStatusMessage('오프라인 모드로 시작합니다');
              setProgress(100);
              if (timeout) clearTimeout(timeout);
              setTimeout(onLoadingComplete, 500);
              return;
            }
          } catch (localError) {
            console.error('로컬 데이터 확인 실패:', localError);
          }
        }
        // 인증 에러의 경우도 계속 진행
        console.error('인증 상태 확인 실패:', authError);
        setStatusMessage('준비 완료');
        setProgress(100);
        if (timeout) clearTimeout(timeout);
        setTimeout(onLoadingComplete, 500);
        return;
      }
      
      // checkAuthStatus 후 토큰 다시 확인
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      
      // 토큰이 없으면 초기화 완료
      if (!currentToken) {
        setStatusMessage('로그인이 필요합니다');
        setProgress(100);
        if (timeout) clearTimeout(timeout);
        setTimeout(onLoadingComplete, 500);
        return;
      }

      // 2. 사용자 정보가 있는 경우 데이터 로드
      if (currentUser && currentToken) {
        try {
          // 3. 가계부 목록 로드 (타임아웃 단축)
          setStatusMessage('가계부 정보를 불러오는 중...');
          setProgress(20);
          const booksLoaded = await Promise.race([
            fetchBooks(currentToken),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('가계부 로드 타임아웃')), 5000))
          ]);
          
          // 현재 가계부 다시 가져오기
          const currentBookState = useBookStore.getState().currentBook;
          
          if (booksLoaded && currentBookState) {
            // 4. 카테고리 및 결제수단 로드 (타임아웃 단축)
            setStatusMessage('카테고리 정보를 불러오는 중...');
            setProgress(30);
            await Promise.race([
              Promise.all([
                fetchCategoriesByBook(currentBookState.id, currentToken),
                fetchPaymentsByBook(currentBookState.id, currentToken)
              ]),
              new Promise((_, reject) => setTimeout(() => reject(new Error('카테고리 로드 타임아웃')), 5000))
            ]);

            // 5. 가계부 멤버 정보 로드 (타임아웃 단축)
            setStatusMessage('멤버 정보를 불러오는 중...');
            setProgress(40);
            await Promise.race([
              fetchBookMembers(currentBookState.id, currentToken),
              new Promise((_, reject) => setTimeout(() => reject(new Error('멤버 로드 타임아웃')), 5000))
            ]);

            // 6. 최근 거래 내역 로드 (타임아웃 단축)
            setStatusMessage('거래 내역을 불러오는 중...');
            setProgress(50);
            await Promise.race([
              fetchLedgers({
                bookId: currentBookState.id,
                page: 0,
                size: 20
              }, currentToken),
              new Promise((_, reject) => setTimeout(() => reject(new Error('거래 내역 로드 타임아웃')), 5000))
            ]);

            // 7. 자산 정보 로드 (타임아웃 단축)
            setStatusMessage('자산 정보를 불러오는 중...');
            setProgress(60);
            await Promise.race([
              Promise.all([
                fetchAssetTypes(currentToken),
                fetchAssetsByBook(currentBookState.id, currentToken)
              ]),
              new Promise((_, reject) => setTimeout(() => reject(new Error('자산 로드 타임아웃')), 5000))
            ]);

            // 8. 예산 정보 로드 (타임아웃 단축)
            setStatusMessage('예산 정보를 불러오는 중...');
            setProgress(70);
            const currentMonth = new Date().toISOString().slice(0, 7);
            try {
              await Promise.race([
                getBudgetSummary(currentBookState.id, currentMonth, currentToken),
                new Promise((_, reject) => setTimeout(() => reject(new Error('예산 로드 타임아웃')), 3000))
              ]);
            } catch (error: any) {
              if (error?.error === 'budget_not_found') {
                console.log('예산 정보 없음 (정상)');
              } else {
                console.log('예산 정보 로드 실패 (계속 진행):', error);
              }
            }

            // 9. 실시간 동기화 연결 (타임아웃 단축)
            setStatusMessage('실시간 동기화 연결 중...');
            setProgress(80);
            if (currentUser.id) {
              try {
                await Promise.race([
                  syncService.connect(currentUser.id, currentBookState.id, currentToken),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('동기화 연결 타임아웃')), 3000))
                ]);
              } catch (error) {
                console.error('동기화 연결 실패 (계속 진행):', error);
              }
            }

            // 10. 알림 서비스 초기화 (타임아웃 단축)
            setStatusMessage('알림 서비스 초기화 중...');
            setProgress(90);
            try {
              const pushToken = await Promise.race([
                notification.registerForPushNotifications(),
                new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('알림 등록 타임아웃')), 3000))
              ]);
              if (pushToken && currentUser.id) {
                try {
                  await notification.registerTokenWithServer(currentUser.id.toString(), pushToken);
                  notification.registerNotificationListeners();
                } catch (tokenError) {
                  console.error('토큰 서버 등록 실패 (계속 진행):', tokenError);
                }
              }
            } catch (error) {
              console.log('알림 서비스 초기화 실패 (계속 진행):', error);
              // 알림 초기화 실패해도 앱은 계속 진행
            }
          }
        } catch (error) {
          console.error('데이터 로드 중 오류:', error);
          // 필수적이지 않은 데이터 로드 실패는 계속 진행
          setStatusMessage('일부 데이터 로드에 실패했습니다');
        }
      }

      // 11. 완료
      setStatusMessage('준비 완료!');
      setProgress(100);
      if (timeout) clearTimeout(timeout);
      
      // 최소 표시 시간 보장 (부드러운 전환을 위해)
      setTimeout(onLoadingComplete, 500);
      
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      setStatusMessage('준비 완료');
      setProgress(100);
      if (timeout) clearTimeout(timeout); // 전체 타임아웃 클리어
      
      // 에러가 발생해도 로딩 완료 처리
      setTimeout(onLoadingComplete, 500);
    }
  };

  // 완전 초기화 함수 분리
  const performCompleteReset = async () => {
    console.log('=== SplashScreen: performCompleteReset 시작 ===');
    try {
      const authStore = useAuthStore.getState();
      
      // authStore의 isLoading이 true인 경우 강제로 false로 설정
      if (authStore.isLoading) {
        console.log('isLoading이 true로 남아있음 - 강제로 false 설정');
      }
      
      // 모든 AsyncStorage 데이터 직접 삭제
      try {
        await AsyncStorage.removeItem('auth-token');
        await AsyncStorage.removeItem('refreshToken');
        console.log('토큰 직접 삭제 완료');
      } catch (e) {
        console.error('토큰 직접 삭제 실패:', e);
      }
      
      await authStore.performCompleteReset();
      setStatusMessage('초기화 완료 - 로그인 화면으로 이동합니다');
      setProgress(100);
      
      // 짧은 대기 후 로딩 완료
      setTimeout(onLoadingComplete, 500);
    } catch (resetError) {
      console.error('완전 초기화 실패:', resetError);
      setStatusMessage('초기화 실패 - 앱을 다시 시작해주세요');
      setProgress(100);
      
      // 초기화 실패해도 로딩 완료 처리 (앱이 멈추지 않도록)
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
          
          {/* 수동 초기화 버튼 (진행률이 100%이고 오류 상태일 때만 표시) */}
          {progress === 100 && statusMessage.includes('초기화') && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.tint }]}
              onPress={async () => {
                try {
                  setStatusMessage('수동 초기화 중...');
                  await performCompleteReset();
                } catch (error) {
                  console.error('수동 초기화 실패:', error);
                  setStatusMessage('초기화 실패 - 앱을 다시 시작해주세요');
                }
              }}
            >
              <Text style={[styles.resetButtonText, { color: colors.background }]}>
                앱 초기화
              </Text>
            </TouchableOpacity>
          )}
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
  resetButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 