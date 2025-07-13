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

**Garabu**는 React Native와 Expo를 기반으로 개발된 모던한 가계부 애플리케이션입니다. 다중 사용자 협업, 실시간 동기화, OAuth 소셜 로그인을 지원하여 개인 및 가족 단위의 종합적인 금융 관리를 제공합니다.

### 🎯 주요 특징

- **🔐 안전한 인증 시스템**: OAuth 2.0 기반 Google/Naver 소셜 로그인, JWT 토큰 자동 갱신
- **👥 다중 사용자 협업**: 가계부 공유, 역할 기반 권한 관리 (OWNER/EDITOR/VIEWER)
- **🔄 실시간 동기화**: WebSocket 기반 실시간 데이터 동기화
- **📊 스마트 가계부 관리**: 카테고리별 분류, 결제 수단 관리, 고급 검색 기능
- **💳 자산 관리**: 다양한 자산 유형별 통합 관리
- **🌙 다크모드 지원**: 사용자 선호도에 따른 테마 자동 전환
- **📱 크로스 플랫폼**: iOS, Android, Web 동시 지원
- **⚡ 성능 최적화**: React Native New Architecture, Zustand 상태 관리
- **🔔 알림 시스템**: 푸시 알림 및 실시간 알림 지원
- **🎯 햅틱 피드백**: 향상된 사용자 경험을 위한 진동 피드백

## 🛠 기술 스택

### Frontend
- **React Native 0.79.5** - 크로스 플랫폼 모바일 앱 개발
- **Expo SDK 53** - 개발 환경 및 배포 플랫폼
- **TypeScript 5.8.3** - 타입 안전성 보장
- **React Navigation 7** - 네비게이션 관리
- **Expo Router 5** - 파일 기반 라우팅

### State Management
- **Zustand 5.0.6** - 경량 상태 관리 라이브러리 (주요 상태 관리)
- **React Context API** - 레거시 인증 상태 관리 (단계적 마이그레이션)

### UI/UX
- **Expo Vector Icons** - 아이콘 시스템
- **React Native Reanimated 3** - 부드러운 애니메이션
- **Expo Haptics** - 햅틱 피드백
- **Expo Blur** - 블러 효과
- **Expo Linear Gradient** - 그라데이션 효과

### Authentication & Security
- **Expo Auth Session** - OAuth 2.0 인증 (Google, Naver)
- **Expo Secure Store** - JWT 토큰 안전 저장
- **Axios Interceptors** - 자동 토큰 갱신 및 요청 인터셉션
- **JWT 토큰 관리** - 액세스/리프레시 토큰 자동 관리

### Real-time & Notifications
- **WebSocket** - 실시간 데이터 동기화
- **Expo Notifications** - 푸시 알림 시스템
- **EventEmitter3** - 이벤트 기반 통신

### Development Tools
- **ESLint** - 코드 품질 관리
- **TypeScript** - 정적 타입 검사
- **Expo CLI** - 개발 및 빌드 도구

## 🏗 프로젝트 구조

```
garabuapp2/
├── app/                    # Expo Router 기반 페이지
│   ├── (auth)/            # 인증 관련 페이지 (로그인, 회원가입)
│   ├── (tabs)/            # 메인 탭 네비게이션 (홈, 탐색, 자산, 더보기)
│   ├── (modals)/          # 모달 페이지 (거래 추가, 설정, 가계부 공유)
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   ├── CategorySelector.tsx # 카테고리 선택 컴포넌트
│   └── SplashScreen.tsx  # 스플래시 스크린
├── contexts/             # React Context (레거시)
│   └── AuthContext.tsx   # 인증 컨텍스트 (마이그레이션 예정)
├── stores/               # Zustand 스토어 (주요 상태 관리)
│   ├── authStore.ts      # 인증 상태 관리
│   ├── bookStore.ts      # 가계부 상태 관리
│   └── categoryStore.ts  # 카테고리 상태 관리
├── services/             # API 및 외부 서비스
│   ├── api.ts           # API 클라이언트 (JWT 토큰 관리)
│   ├── oauthService.ts  # OAuth 서비스
│   ├── syncService.ts   # 실시간 동기화 서비스
│   └── notificationService.ts # 알림 서비스
├── config/              # 설정 파일
│   └── config.ts        # 환경별 API 설정
├── hooks/               # 커스텀 훅
├── constants/           # 상수 정의
└── assets/             # 이미지, 폰트 등
```

## 🚀 주요 기능

### 1. 인증 시스템
- **소셜 로그인**: Google, Naver OAuth 2.0 지원
- **JWT 토큰 관리**: 자동 토큰 갱신 및 보안 저장
- **보안 저장**: Expo Secure Store를 통한 안전한 토큰 저장
- **인증 상태 동기화**: Zustand 기반 전역 인증 상태 관리

### 2. 가계부 관리
- **다중 가계부**: 여러 가계부 생성 및 관리
- **공유 가계부**: 역할 기반 협업 (OWNER/EDITOR/VIEWER)
- **수입/지출 기록**: 카테고리별 거래 내역 관리, 자동 지출자 정보 입력
- **고급 검색**: 날짜, 카테고리, 결제 수단별 필터링
- **실시간 동기화**: WebSocket 기반 실시간 데이터 업데이트
- **Pull-to-Refresh**: 모든 화면에서 당겨서 새로고침 지원

### 3. 협업 기능
- **멤버 초대**: 이메일 기반 가계부 멤버 초대
- **권한 관리**: 세분화된 역할 기반 접근 제어
  - OWNER: 모든 권한 (멤버 관리, 가계부 삭제)
  - EDITOR: 거래 추가/수정/삭제, 카테고리 관리
  - VIEWER: 읽기 전용 권한
- **실시간 알림**: 가계부 변경 사항 즉시 알림
- **멤버 관리**: 역할 변경, 멤버 제거 기능

### 4. 카테고리 시스템
- **기본 카테고리**: 시스템 제공 기본 카테고리
- **사용자 정의 카테고리**: 가계부별 커스텀 카테고리 생성
- **이모지 지원**: 카테고리별 이모지 아이콘
- **권한 기반 관리**: OWNER/EDITOR만 카테고리 생성 가능

### 5. 자산 관리
- **다중 자산**: 현금, 카드, 투자 등 다양한 자산 유형
- **자산 현황**: 통합 자산 대시보드
- **자산 변동**: 자산 변화 이력 추적

### 6. 실시간 기능
- **WebSocket 연결**: 실시간 데이터 동기화
- **동기화 상태 표시**: 연결 상태 및 동기화 현황
- **오프라인 지원**: 오프라인 변경사항 자동 동기화
- **충돌 해결**: 동시 편집 시 자동 충돌 해결

### 7. 사용자 경험
- **다크모드**: 시스템 설정에 따른 자동 테마 전환
- **햅틱 피드백**: 터치 시 진동 피드백
- **애니메이션**: 부드러운 화면 전환 및 인터랙션
- **오류 처리**: 사용자 친화적 오류 메시지 및 중복 데이터 처리
- **Pull-to-Refresh**: 직관적인 새로고침 인터페이스

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn
- Expo CLI
- iOS Simulator (macOS) 또는 Android Studio
- **백엔드 서버**: garabuserver가 실행 중이어야 함 (`./gradlew bootRun`)

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
# config/config.ts 파일에서 API 설정 확인
# 개발 환경에서는 백엔드 서버 IP 설정 필요

# 개발 환경 (로컬 네트워크)
API_BASE_URL: 'http://192.168.10.54:8080'

# 프로덕션 환경
API_BASE_URL: 'https://api.garabu.com'
```

### 백엔드 서버 연동
```bash
# 1. 백엔드 서버 디렉토리로 이동
cd ../garabuserver

# 2. 백엔드 서버 실행
./gradlew bootRun

# 3. 모바일 앱에서 로컬 네트워크 IP로 API 연동
# config/config.ts에서 개발용 IP 주소 설정
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

// 가계부 상태 관리 (확장됨)
interface BookState {
  currentBook: Book | null;
  books: Book[];
  bookMembers: BookMember[];
  ledgers: Ledger[];
  createLedger: (data: CreateLedgerRequest) => Promise<boolean>;
  fetchBookMembers: (bookId: number, token: string) => Promise<boolean>;
  inviteUser: (bookId: number, data: InviteUserRequest, token: string) => Promise<boolean>;
  removeMember: (bookId: number, memberId: number, token: string) => Promise<boolean>;
  changeRole: (bookId: number, memberId: number, data: ChangeRoleRequest, token: string) => Promise<boolean>;
  leaveBook: (bookId: number, token: string) => Promise<boolean>;
}

// 카테고리 상태 관리 (새로 추가)
interface CategoryState {
  categories: Category[];
  payments: PaymentMethod[];
  fetchCategoriesByBook: (bookId: number, token: string) => Promise<boolean>;
  createCategoryForBook: (bookId: number, data: CreateCategoryRequest, token: string) => Promise<boolean>;
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
- **JWT 토큰**: 안전한 토큰 기반 인증 (액세스 10분, 리프레시 24시간)
- **Expo Secure Store**: 민감한 정보 암호화 저장
- **OAuth 2.0**: Google, Naver 표준 인증 프로토콜
- **자동 토큰 갱신**: 401 응답 시 자동 리프레시 토큰으로 갱신
- **역할 기반 접근 제어**: OWNER/EDITOR/VIEWER 권한 체크

### 데이터 보안
- **HTTPS 통신**: 모든 API 통신 암호화
- **토큰 재연결**: WebSocket 재연결 시 안전한 토큰 관리
- **입력 검증**: 클라이언트 및 서버 양방향 데이터 검증
- **오류 처리**: 민감한 정보 노출 방지를 위한 안전한 오류 메시지

## 📈 성능 최적화

### React Native 최적화
- **New Architecture**: React Native 0.79.5 New Architecture 활용
- **Zustand 상태 관리**: 가벼운 상태 관리로 성능 향상
- **메모이제이션**: React.memo, useMemo, useCallback 활용
- **이미지 최적화**: Expo Image 컴포넌트 사용
- **Pull-to-Refresh**: 효율적인 데이터 새로고침

### 실시간 기능 최적화
- **WebSocket 재연결**: 자동 재연결 및 백오프 전략
- **이벤트 디바운싱**: 과도한 이벤트 처리 방지
- **로컬 캐싱**: 오프라인 지원 및 성능 향상

### API 최적화
- **요청 최적화**: Axios 인터셉터를 통한 효율적 요청 관리
- **토큰 관리**: 자동 토큰 갱신으로 불필요한 재인증 방지
- **오류 처리**: 구조화된 오류 응답으로 사용자 경험 향상

## 🧪 테스트 전략

### 단위 테스트
- **Jest**: 테스트 프레임워크
- **React Native Testing Library**: 컴포넌트 테스트
- **Mock Service**: OAuth 서비스 모킹
- **Zustand 테스트**: 상태 관리 로직 테스트

### 통합 테스트
- **E2E 테스트**: 전체 사용자 플로우 테스트
- **API 테스트**: 백엔드 API 연동 테스트
- **실시간 동기화 테스트**: WebSocket 연결 테스트

## 🚀 배포 및 배포

### Expo EAS Build
```bash
# 프로덕션 빌드
eas build --platform ios
eas build --platform android

# 개발 빌드
eas build --profile development

# 내부 테스트 배포
eas submit --platform ios
eas submit --platform android
```

### 스토어 배포
- **App Store Connect**: iOS 앱 배포
- **Google Play Console**: Android 앱 배포
- **버전 관리**: Semantic Versioning (현재 v1.0.0)

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
- **컴포넌트 구조**: Atomic Design 원칙 준수

### 브랜치 전략
- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 새로운 기능 개발
- `hotfix/*`: 긴급 버그 수정

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👨‍💻 개발자 정보
 
**이메일**: ujk6073@gmail.com  
**GitHub 이슈페이지**: [이슈페이지](https://github.com/yhj0904)

## 🆕 최신 업데이트 (2025-01-11)

### 🔄 실시간 동기화 시스템
- WebSocket 기반 실시간 데이터 동기화 구현
- 오프라인 변경사항 자동 동기화
- 동기화 상태 표시 및 관리

### 👥 가계부 공유 관리 개선
- 멤버 초대/제거 기능 강화
- 역할 변경 기능 추가
- 멤버별 권한 관리 UI 개선

### 🏷️ 카테고리 시스템 업그레이드
- 이모지 지원 추가
- 기본/사용자 정의 카테고리 구분
- 가계부별 독립적인 카테고리 관리

### 📱 UX 개선사항
- 모든 주요 화면에 Pull-to-Refresh 추가
- 햅틱 피드백 적용
- 에러 메시지 및 로딩 상태 개선

### 🔔 알림 시스템
- 푸시 알림 기능 구현
- 예산 초과 알림
- 새로운 거래 알림
- 멤버 초대 알림
