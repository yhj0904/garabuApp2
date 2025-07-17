// kakaoService.ts의 상단에 추가
import { Linking } from 'react-native';

// login 메서드 시작 부분에 추가
async login(): Promise<KakaoLoginResponse> {
  console.log('=== Kakao Login Process Started ===');
  
  // URL Scheme 확인
  const kakaoScheme = 'kakao9232996cd9a91757d2e423adfb12254a://';
  const canOpen = await Linking.canOpenURL(kakaoScheme);
  console.log(`Can open Kakao URL scheme: ${canOpen}`);
  
  // 카카오톡 설치 확인
  const kakaoTalkScheme = 'kakaokompassauth://';
  const isKakaoTalkInstalled = await Linking.canOpenURL(kakaoTalkScheme);
  console.log(`KakaoTalk installed: ${isKakaoTalkInstalled}`);
  
  // URL 이벤트 리스너 추가 (임시)
  const subscription = Linking.addEventListener('url', (event) => {
    console.log('URL Event received:', event.url);
    if (event.url.includes('kakao')) {
      console.log('Kakao callback detected!');
    }
  });
  
  if (!login) {
    console.error('Kakao SDK not available');
    throw new Error('Kakao SDK not available. Please use a development build.');
  }

  try {
    // 기존 로그인 코드...
    console.log('Calling Kakao login()...');
    const result = await login();
    
    // 리스너 제거
    subscription.remove();
    
    // 로그인 결과 로깅...
    return result;
  } catch (error: any) {
    // 리스너 제거
    subscription.remove();
    
    // 에러 처리...
    throw error;
  }
}