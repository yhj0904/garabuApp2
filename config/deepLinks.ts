import * as Linking from 'expo-linking';
import { router } from 'expo-router';

// Deep link URL 매핑
export const deepLinkConfig = {
  prefixes: [
    Linking.createURL('/'),
    'garabuapp2://',
    'https://garabu.com',
    'https://*.garabu.com',
  ],
  config: {
    screens: {
      // 홈
      '(tabs)': {
        screens: {
          index: 'home',
          explore: 'explore',
          asset: 'asset',
          friends: 'friends',
          profile: 'profile',
        },
      },
      // 가계부 관련
      '(modals)/book/[id]': 'book/:id',
      '(modals)/book/[id]/budget': 'book/:id/budget',
      '(modals)/book/[id]/members': 'book/:id/members',
      '(modals)/book/[id]/settings': 'book/:id/settings',
      // 거래 내역 관련
      '(modals)/ledger/[id]': 'ledger/:id',
      '(modals)/ledger/create': 'ledger/create',
      // 친구 관련
      '(modals)/friends/requests': 'friends/requests',
      '(modals)/friends/[id]': 'friends/:id',
      // 알림
      '(modals)/notifications': 'notifications',
      // 인증
      '(auth)/login': 'login',
      '(auth)/signup': 'signup',
    },
  },
};

// Deep link 파싱 및 네비게이션
export function handleDeepLink(url: string) {
  console.log('[Deep Link] Handling URL:', url);
  
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.replace(/^\//, '');
    const queryParams = parsedUrl.searchParams;
    
    console.log('[Deep Link] Parsed path:', path);
    console.log('[Deep Link] Query params:', Object.fromEntries(queryParams));
    
    // 알림에서 온 경우 처리
    if (queryParams.has('notificationId')) {
      const notificationId = queryParams.get('notificationId');
      console.log('[Deep Link] Notification ID:', notificationId);
      // 알림 관련 처리
    }
    
    // 라우트 매핑에 따라 네비게이션
    const routeMap: Record<string, string> = {
      // 메인 탭
      'tabs/home': '/(tabs)',
      'tabs/explore': '/(tabs)/explore',
      'tabs/asset': '/(tabs)/asset',
      'tabs/more': '/(tabs)/more',
      
      // 인증 관련
      'auth/login': '/(auth)/login',
      'auth/signup': '/(auth)/signup',
      
      // 모달
      '(modals)/profile': '(modals)/profile',
      '(modals)/notifications': '(modals)/notifications',
      '(modals)/settings': '(modals)/settings',
      '(modals)/help': '(modals)/help',
      '(modals)/about': '(modals)/about',
      '(modals)/add-transaction': '(modals)/add-transaction',
      '(modals)/book-creation': '(modals)/book-creation',
      '(modals)/book-sharing': '(modals)/book-sharing',
      '(modals)/advanced-stats': '(modals)/advanced-stats',
      '(modals)/budget-settings': '(modals)/budget-settings',
      '(modals)/manage-categories': '(modals)/manage-categories',
      '(modals)/change-password': '(modals)/change-password',
      // 친구 관련 - friends/requests 제거
    };

    const mappedRoute = routeMap[path] || path;
    
    // friends/requests 경로는 홈 탭으로 리다이렉트
    if (path === 'friends/requests') {
      router.push('/(tabs)');
      return;
    }
    
    // 특수 경로 처리
    if (path === 'books' || path === 'book/select') {
      router.push('/(modals)/select-book');
    } else if (path.startsWith('book/')) {
      const bookId = path.split('/')[1];
      router.push({
        pathname: '/(modals)/book/[id]',
        params: { id: bookId }
      });
    } else if (path.startsWith('transaction/')) {
      const transactionId = path.split('/')[1];
      router.push({
        pathname: '/(modals)/ledger/[id]',
        params: { id: transactionId }
      });
    } else if (mappedRoute) {
      router.push(mappedRoute as any);
    } else {
      console.log('[Deep Link] No route found for path:', path);
      router.push('/(tabs)');
    }
  } catch (error) {
    console.error('[Deep Link] Error handling deep link:', error);
    router.push('/(tabs)');
  }
}

// 알림에서 받은 데이터로 네비게이션
export function navigateFromNotification(data: any) {
  console.log('[Notification] Navigate from notification data:', data);
  
  // 알림 타입에 따른 네비게이션
  if (data.type === 'BOOK_INVITATION') {
    router.push({
      pathname: '/(modals)/invite-code',
      params: { inviteCode: data.inviteCode }
    });
  } else if (data.type === 'FRIEND_REQUEST') {
    // friends/requests 대신 홈 탭으로 이동
    router.push('/(tabs)');
  } else if (data.type === 'TRANSACTION_ADDED') {
    router.push({
      pathname: '/(modals)/ledger/[id]',
      params: { id: data.transactionId }
    });
  } else if (data.deepLink) {
    handleDeepLink(data.deepLink);
  } else {
    // 기본값: 홈으로 이동
    router.push('/(tabs)');
  }
}

// Deep link 구독 설정
export function subscribeToDeepLinks() {
  // URL 리스너 설정
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });
  
  // 초기 URL 확인
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('Initial URL:', url);
      handleDeepLink(url);
    }
  });
  
  return subscription;
}