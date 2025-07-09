# Garabu App

React Native와 Expo를 사용한 모바일 애플리케이션입니다.

## 🚀 주요 기능

### 인증 시스템
- **JWT 토큰 기반 인증** - Spring Security 엔드포인트 사용
- **OAuth2 소셜 로그인** - Google, Naver 로그인 지원
- **자동 로그인** - 앱 재시작 시 저장된 토큰으로 자동 로그인
- **Expo SecureStore** - JWT 토큰을 안전하게 저장

### UI/UX
- **다크/라이트 모드** - 시스템 테마에 따른 자동 테마 변경
- **반응형 디자인** - 다양한 화면 크기에 최적화
- **스플래시 화면** - 앱 로고, 로딩 애니메이션, 진행률 표시

## 🛠 기술 스택

- **React Native** - 크로스 플랫폼 모바일 개발
- **Expo** - 개발 도구 및 서비스
- **TypeScript** - 타입 안전성
- **Zustand** - 상태 관리
- **Expo Router** - 파일 기반 라우팅
- **Spring Security** - 백엔드 인증 시스템

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 플랫폼별 실행
npm run ios      # iOS 시뮬레이터
npm run android  # Android 에뮬레이터
npm run web      # 웹 브라우저
```

## 📁 프로젝트 구조

```
garabuapp2/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   ├── login.tsx          # 로그인 화면
│   ├── signup.tsx         # 회원가입 화면
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
│   ├── SplashScreen.tsx   # 스플래시 화면
│   └── AuthNavigator.tsx  # 인증 라우팅 처리
├── stores/               # Zustand 상태 관리
│   └── authStore.ts      # 인증 상태 관리
├── services/             # API 서비스
│   ├── api.ts           # API 호출 로직
│   └── oauthService.ts  # OAuth 소셜 로그인
├── constants/            # 상수 정의
└── hooks/               # 커스텀 훅
```

## 🔐 인증 시스템

### 일반 로그인
- **엔드포인트**: `POST /login`
- **파라미터**: `email`, `password`
- JWT 토큰을 SecureStore에 저장 후 메인 화면으로 이동

### 회원가입
- **엔드포인트**: `POST /api/v2/join`
- **파라미터**: `email`, `username`, `password`
- 회원가입 성공 시 자동 로그인

### OAuth2 소셜 로그인

#### 플로우
1. **OAuth 버튼 클릭** → 서버 OAuth 엔드포인트로 리다이렉트
2. **서버 OAuth 처리** → 백엔드에서 OAuth 제공자와 통신
3. **토큰 발급** → 서버에서 access/refresh 토큰 발급
4. **클라이언트 리다이렉트** → `garabuapp2://oauth-callback?access_token=xxx&refresh_token=yyy`
5. **토큰 파싱** → URL 파라미터에서 토큰 추출
6. **로그인 완료** → 추출한 토큰으로 로그인 완료

#### 엔드포인트
- **Google**: `GET /oauth2/authorization/google`
- **Naver**: `GET /oauth2/authorization/naver`
- **토큰 검증**: `POST /api/v2/oauth/login`

### 로그아웃
- **엔드포인트**: `POST /api/v2/logout`
- 저장된 토큰 삭제 후 로그인 화면으로 이동

## 🔧 설정

### OAuth 설정
1. **백엔드 서버**: Spring Security OAuth2 설정
2. **클라이언트**: `app.json`의 scheme 확인 (`"scheme": "garabuapp2"`)
3. **리다이렉트 URI**: `garabuapp2://oauth-callback`

### 서버 URL 설정
- **개발 환경**: `http://localhost:8080`
- **프로덕션 환경**: 실제 서버 URL로 변경

## 📊 상태 관리

### Zustand 스토어 (useAuthStore)
```typescript
{
  user: { id, username, email },  // 사용자 정보
  token: string,                  // JWT access 토큰
  refreshToken: string,           // JWT refresh 토큰
  isAuthenticated: boolean,       // 로그인 상태
  isLoading: boolean              // 로딩 상태
}
```

### 주요 메서드
- `login(email, password)` - 일반 로그인
- `signup(email, username, password)` - 회원가입
- `oauthLogin(provider, accessToken, refreshToken)` - OAuth 로그인
- `logout()` - 로그아웃
- `initializeAuth()` - 앱 시작 시 인증 상태 초기화

## 🧪 테스트

### 테스트 계정
- **이메일**: test@example.com
- **비밀번호**: password

### 개발 환경
- **Mock API**: 실제 서버 없이도 테스트 가능
- **1초 지연**: 실제 API 호출 시뮬레이션

## 🔒 보안

### JWT 토큰 관리
- **Expo SecureStore**: iOS Keychain, Android Keystore 사용
- **Access Token**: API 호출용 토큰
- **Refresh Token**: 토큰 갱신용 토큰
- **자동 갱신**: 토큰 만료 시 자동 갱신

### OAuth 보안
- **서버 기반**: OAuth 시크릿이 클라이언트에 노출되지 않음
- **리다이렉트 URI 검증**: 앱 스킴 기반 검증
- **토큰 검증**: 서버에서 발급한 토큰만 허용

## 🚨 문제 해결

### 일반적인 문제
- **Metro 번들러 오류**: `npm start --clear`
- **iOS 빌드 오류**: Xcode 캐시 정리
- **Android 빌드 오류**: Gradle 캐시 정리

### 인증 관련 문제
- **토큰 만료**: 자동으로 로그인 화면으로 이동
- **OAuth 오류**: 클라이언트 ID 및 리다이렉트 URI 확인
- **저장소 오류**: SecureStore 권한 확인

## 📄 라이센스

MIT License

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
