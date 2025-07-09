# 🏦 Garabu - 스마트 가계부 앱

<div align="center">
  <img src="./assets/images/GarabuLogo.png" alt="Garabu Logo" width="120" height="120" />
  
  **당신의 일상을 더 스마트하게**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-53.0.19-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
  [![Zustand](https://img.shields.io/badge/Zustand-5.0.6-purple.svg)](https://zustand-demo.pmnd.rs/)
</div>

## 📱 프로젝트 개요

**Garabu**는 React Native와 Expo를 기반으로 개발된 모던한 가계부 애플리케이션입니다. 사용자가 일상의 수입과 지출을 쉽게 관리하고, 자산 현황을 한눈에 파악할 수 있도록 도와주는 개인 금융 관리 도구입니다.

### 🎯 주요 특징

- **🔐 안전한 인증 시스템**: OAuth 2.0 기반 Google/Naver 소셜 로그인
- **📊 실시간 통계**: 직관적인 차트와 그래프로 지출 패턴 분석
- **💳 자산 관리**: 다양한 자산 유형별 통합 관리
- **🌙 다크모드 지원**: 사용자 선호도에 따른 테마 자동 전환
- **📱 크로스 플랫폼**: iOS, Android, Web 동시 지원
- **⚡ 성능 최적화**: React Native New Architecture 활용

## 🛠 기술 스택

### Frontend
- **React Native 0.79.5** - 크로스 플랫폼 모바일 앱 개발
- **Expo SDK 53** - 개발 환경 및 배포 플랫폼
- **TypeScript 5.8.3** - 타입 안전성 보장
- **React Navigation 7** - 네비게이션 관리
- **Expo Router 5** - 파일 기반 라우팅

### State Management
- **Zustand 5.0.6** - 경량 상태 관리 라이브러리
- **React Context API** - 전역 상태 관리

### UI/UX
- **Expo Vector Icons** - 아이콘 시스템
- **React Native Reanimated 3** - 부드러운 애니메이션
- **Expo Haptics** - 햅틱 피드백
- **Expo Blur** - 블러 효과
- **Expo Linear Gradient** - 그라데이션 효과

### Authentication & Security
- **Expo Auth Session** - OAuth 인증
- **Expo Secure Store** - 안전한 토큰 저장
- **Expo Crypto** - 암호화 기능

### Development Tools
- **ESLint** - 코드 품질 관리
- **TypeScript** - 정적 타입 검사
- **Expo CLI** - 개발 및 빌드 도구

## 🏗 프로젝트 구조

```
garabuapp2/
├── app/                    # Expo Router 기반 페이지
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (tabs)/            # 메인 탭 네비게이션
│   ├── (modals)/          # 모달 페이지
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   └── SplashScreen.tsx  # 스플래시 스크린
├── contexts/             # React Context
│   └── AuthContext.tsx   # 인증 컨텍스트
├── stores/               # Zustand 스토어
│   └── authStore.ts      # 인증 상태 관리
├── services/             # API 및 외부 서비스
│   ├── api.ts           # API 클라이언트
│   └── oauthService.ts  # OAuth 서비스
├── hooks/               # 커스텀 훅
├── constants/           # 상수 정의
└── assets/             # 이미지, 폰트 등
```

## 🚀 주요 기능

### 1. 인증 시스템
- **소셜 로그인**: Google, Naver OAuth 2.0 지원
- **토큰 관리**: JWT 기반 인증 및 자동 갱신
- **보안 저장**: Expo Secure Store를 통한 안전한 토큰 저장

### 2. 가계부 관리
- **수입/지출 기록**: 카테고리별 거래 내역 관리
- **실시간 잔액**: 현재 자산 현황 실시간 표시
- **거래 내역**: 최근 거래 내역 조회 및 필터링

### 3. 통계 및 분석
- **지출 패턴**: 월별/카테고리별 지출 분석
- **수입 추이**: 수입 변화 추이 그래프
- **예산 관리**: 카테고리별 예산 설정 및 추적

### 4. 자산 관리
- **다중 자산**: 현금, 카드, 투자 등 다양한 자산 유형
- **자산 현황**: 통합 자산 대시보드
- **자산 변동**: 자산 변화 이력 추적

### 5. 사용자 경험
- **다크모드**: 시스템 설정에 따른 자동 테마 전환
- **햅틱 피드백**: 터치 시 진동 피드백
- **애니메이션**: 부드러운 화면 전환 및 인터랙션

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn
- Expo CLI
- iOS Simulator (macOS) 또는 Android Studio

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/garabuapp2.git
cd garabuapp2

# 의존성 설치
npm install

# 개발 서버 시작
npm start

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# 웹에서 실행
npm run web
```

### 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필요한 환경 변수 설정
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_OAUTH_CLIENT_ID=your_oauth_client_id
```

## 📱 앱 스크린샷

### 메인 화면
- 홈 대시보드: 잔액, 최근 거래, 빠른 액션
- 통계 화면: 지출 패턴, 수입 추이 분석
- 자산 화면: 다양한 자산 유형별 관리
- 설정 화면: 사용자 프로필 및 앱 설정

### 인증 화면
- 로그인: 이메일/비밀번호 및 소셜 로그인
- 회원가입: 새로운 계정 생성
- OAuth 플로우: Google/Naver 소셜 인증

## 🏛 아키텍처 설계

### 상태 관리 아키텍처
```typescript
// Zustand를 활용한 전역 상태 관리
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}
```

### 컴포넌트 아키텍처
- **Atomic Design**: 재사용 가능한 UI 컴포넌트 설계
- **Container/Presentational Pattern**: 로직과 UI 분리
- **Custom Hooks**: 비즈니스 로직 추상화

### 네비게이션 아키텍처
- **File-based Routing**: Expo Router를 활용한 직관적인 라우팅
- **Stack Navigation**: 인증 플로우 관리
- **Tab Navigation**: 메인 기능별 탭 구성

## 🔒 보안 고려사항

### 인증 보안
- **JWT 토큰**: 안전한 토큰 기반 인증
- **Secure Store**: 민감한 정보 암호화 저장
- **OAuth 2.0**: 표준 인증 프로토콜 사용

### 데이터 보안
- **HTTPS 통신**: 모든 API 통신 암호화
- **토큰 갱신**: 자동 토큰 갱신 메커니즘
- **입력 검증**: 사용자 입력 데이터 검증

## 📈 성능 최적화

### React Native 최적화
- **New Architecture**: React Native 0.79.5 New Architecture 활용
- **메모이제이션**: React.memo, useMemo, useCallback 활용
- **이미지 최적화**: Expo Image 컴포넌트 사용

### 번들 최적화
- **Tree Shaking**: 사용하지 않는 코드 제거
- **Code Splitting**: 동적 import를 통한 코드 분할
- **Lazy Loading**: 필요시에만 컴포넌트 로드

## 🧪 테스트 전략

### 단위 테스트
- **Jest**: 테스트 프레임워크
- **React Native Testing Library**: 컴포넌트 테스트
- **Mock Service**: OAuth 서비스 모킹

### 통합 테스트
- **E2E 테스트**: 전체 사용자 플로우 테스트
- **API 테스트**: 백엔드 API 연동 테스트

## 🚀 배포 및 배포

### Expo EAS Build
```bash
# 프로덕션 빌드
eas build --platform ios
eas build --platform android

# 개발 빌드
eas build --profile development
```

### 스토어 배포
- **App Store Connect**: iOS 앱 배포
- **Google Play Console**: Android 앱 배포

## 🤝 기여 가이드

### 개발 워크플로우
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 코드 스타일
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안전성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👨‍💻 개발자 정보
 
**이메일**: ujk6073@gmail.com  
**GitHub 이슈페이지**: [이슈페이지](https://github.com/yhj0904)

## 🙏 감사의 말

- [Expo](https://expo.dev/) - 개발 플랫폼 제공
- [React Native](https://reactnative.dev/) - 크로스 플랫폼 개발 프레임워크
- [Zustand](https://zustand-demo.pmnd.rs/) - 상태 관리
- [React Navigation](https://reactnavigation.org/) - 네비게이션 솔루션

---

<div align="center">
  <strong>⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! ⭐</strong>
</div>
