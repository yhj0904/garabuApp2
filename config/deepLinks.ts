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
  console.log('=== Deep Link Handler ===');
  console.log('Received URL:', url);
  console.log('========================');
  
  try {
    
    const parsedUrl = Linking.parse(url);
    console.log('Parsed URL:', parsedUrl);
    
    const { hostname, path, queryParams } = parsedUrl;
    
    // URL 패턴 매칭
    if (path) {
      // 가계부 상세
      if (path.match(/^book\/(\d+)$/)) {
        const bookId = path.match(/^book\/(\d+)$/)?.[1];
        if (bookId) {
          router.push(`/(modals)/book/${bookId}`);
          return;
        }
      }
      
      // 가계부 예산
      if (path.match(/^book\/(\d+)\/budget$/)) {
        const bookId = path.match(/^book\/(\d+)\/budget$/)?.[1];
        if (bookId) {
          router.push(`/(modals)/book/${bookId}/budget`);
          return;
        }
      }
      
      // 거래 내역 상세
      if (path.match(/^ledger\/(\d+)$/)) {
        const ledgerId = path.match(/^ledger\/(\d+)$/)?.[1];
        if (ledgerId && queryParams?.bookId) {
          router.push({
            pathname: `/(modals)/ledger/${ledgerId}`,
            params: { bookId: queryParams.bookId as string }
          });
          return;
        }
      }
      
      // 친구 요청
      if (path === 'friends/requests') {
        router.push('/(modals)/friends/requests');
        return;
      }
      
      // 친구 목록
      if (path === 'friends') {
        router.push('/(tabs)/friends');
        return;
      }
      
      // 가계부 목록
      if (path === 'books') {
        router.push('/(tabs)/index');
        return;
      }
      
      // 홈
      if (path === 'home') {
        router.push('/(tabs)/index');
        return;
      }
    }
    
    // 기본 홈으로 이동
    router.push('/(tabs)/index');
  } catch (error) {
    console.error('Deep link handling error:', error);
    // 에러 시 홈으로 이동
    router.push('/(tabs)/index');
  }
}

// 알림에서 받은 데이터로 네비게이션
export function navigateFromNotification(data: any) {
  console.log('Navigating from notification data:', data);
  
  if (data.url) {
    handleDeepLink(data.url);
    return;
  }
  
  // action 기반 네비게이션 (fallback)
  switch (data.action) {
    case 'open_transaction_detail':
      if (data.ledgerId && data.bookId) {
        router.push({
          pathname: `/(modals)/ledger/${data.ledgerId}`,
          params: { bookId: data.bookId }
        });
      }
      break;
      
    case 'open_book_detail':
      if (data.bookId) {
        router.push(`/(modals)/book/${data.bookId}`);
      }
      break;
      
    case 'open_book_list':
      router.push('/(tabs)/index');
      break;
      
    case 'open_friend_requests':
      router.push('/(modals)/friends/requests');
      break;
      
    case 'open_friends':
      router.push('/(tabs)/friends');
      break;
      
    case 'open_budget_detail':
      if (data.bookId) {
        router.push(`/(modals)/book/${data.bookId}/budget`);
      }
      break;
      
    default:
      router.push('/(tabs)/index');
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