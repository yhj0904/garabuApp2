# Garabu App

React Native와 Expo를 사용한 모바일 애플리케이션입니다.

## 주요 기능

### 🔐 인증 시스템
- **JWT 토큰 기반 인증**: 안전한 토큰 기반 인증 시스템
- **Spring Security 엔드포인트**: `/login` 엔드포인트 사용
- **OAuth2 소셜 로그인**: Google, Naver 로그인 지원
- **Expo SecureStore**: JWT 토큰을 안전하게 저장
- **Zustand 상태 관리**: 가볍고 효율적인 상태 관리
- **자동 로그인**: 앱 재시작 시 저장된 토큰으로 자동 로그인

### 📱 UI/UX
- **다크/라이트 모드**: 시스템 테마에 따른 자동 테마 변경
- **반응형 디자인**: 다양한 화면 크기에 최적화
- **접근성**: 스크린 리더 지원 및 키보드 네비게이션
- **소셜 로그인 버튼**: Google, Naver 브랜드 컬러 적용

## 기술 스택

- **React Native**: 크로스 플랫폼 모바일 개발
- **Expo**: 개발 도구 및 서비스
- **TypeScript**: 타입 안전성
- **Zustand**: 상태 관리
- **Expo Router**: 파일 기반 라우팅
- **Expo SecureStore**: 안전한 데이터 저장
- **Expo AuthSession**: OAuth 인증
- **Spring Security**: 백엔드 인증 시스템

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

### 3. 플랫폼별 실행
```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web
```

## 프로젝트 구조

```
garabuapp2/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   ├── login.tsx          # 로그인 화면
│   ├── signup.tsx         # 회원가입 화면
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
├── stores/               # Zustand 상태 관리
│   └── authStore.ts      # 인증 상태 관리
├── services/             # API 서비스
│   ├── api.ts           # API 호출 로직
│   └── oauthService.ts  # OAuth 소셜 로그인
├── constants/            # 상수 정의
└── hooks/               # 커스텀 훅
```

## 인증 시스템

### 일반 로그인
- **엔드포인트**: `POST /login` (Spring Security 기본)
- **파라미터**: `email`, `password`
- JWT 토큰을 SecureStore에 안전하게 저장
- 로그인 성공 시 메인 화면으로 자동 이동

### 회원가입
- **엔드포인트**: `POST /api/v2/join`
- **파라미터**: `email`, `username`, `password`
- 비밀번호 확인 기능
- 회원가입 성공 시 자동 로그인

### OAuth2 소셜 로그인
- **백엔드 서버 기반**: 클라이언트는 서버의 OAuth 엔드포인트로 리다이렉트
- **Google 로그인**: `GET /oauth2/authorization/google`
- **Naver 로그인**: `GET /oauth2/authorization/naver`
- **토큰 수신**: 서버에서 발급한 access/refresh 토큰을 URL 파라미터로 수신
- **엔드포인트**: `POST /api/v2/oauth/login` (토큰 검증 및 사용자 정보 조회)

### 로그아웃
- **엔드포인트**: `POST /api/v2/logout`
- 저장된 토큰 삭제
- 로그인 화면으로 이동

## API 엔드포인트

### 인증 관련
- `POST /login` - 일반 로그인 (Spring Security)
- `POST /api/v2/join` - 회원가입
- `GET /oauth2/authorization/google` - Google OAuth 리다이렉트
- `GET /oauth2/authorization/naver` - Naver OAuth 리다이렉트
- `POST /api/v2/oauth/login` - OAuth 토큰 검증 및 로그인
- `POST /api/v2/logout` - 로그아웃
- `GET /api/v2/profile` - 사용자 정보 조회

### 개발 환경
- **Mock API**: 실제 서버 없이도 테스트 가능
- **1초 지연**: 실제 API 호출 시뮬레이션

### 프로덕션 환경
- **서버 URL**: `http://localhost:8080` (개발용)
- **JWT 토큰**: Authorization 헤더에 Bearer 토큰 포함
- **Refresh 토큰**: 토큰 갱신을 위한 refresh 토큰 관리

## OAuth 플로우

### 클라이언트 → 서버 플로우
1. **OAuth 버튼 클릭**: 사용자가 Google/Naver 로그인 버튼 클릭
2. **서버 리다이렉트**: 클라이언트가 서버의 OAuth 엔드포인트로 리다이렉트
   - Google: `http://localhost:8080/oauth2/authorization/google`
   - Naver: `http://localhost:8080/oauth2/authorization/naver`
3. **서버 OAuth 처리**: 백엔드 서버에서 OAuth 제공자와 통신
4. **토큰 발급**: 서버에서 access/refresh 토큰 발급
5. **클라이언트 리다이렉트**: 서버가 클라이언트로 토큰과 함께 리다이렉트
   - URL: `garabuapp2://oauth-callback?access_token=xxx&refresh_token=yyy`
6. **토큰 파싱**: 클라이언트에서 URL 파라미터에서 토큰 추출
7. **로그인 완료**: 추출한 토큰으로 로그인 완료

### 장점
- **보안**: OAuth 시크릿이 클라이언트에 노출되지 않음
- **단순화**: 클라이언트는 단순히 리다이렉트만 처리
- **통합**: 서버에서 일관된 인증 플로우 관리
- **토큰 관리**: 서버에서 토큰 갱신 및 관리

## OAuth 설정

### 백엔드 서버 설정
1. Spring Security OAuth2 설정
2. Google/Naver OAuth 클라이언트 등록
3. 리다이렉트 URI 설정: `garabuapp2://oauth-callback`

### 클라이언트 설정
1. `app.json`의 scheme 확인: `"scheme": "garabuapp2"`
2. `services/oauthService.ts`에서 서버 URL 설정
3. 리다이렉트 URI: `garabuapp2://oauth-callback`

## 테스트 계정

개발용 테스트 계정이 제공됩니다:
- **이메일**: test@example.com
- **비밀번호**: password

## 상태 관리

### Zustand 스토어
- **useAuthStore**: 인증 관련 상태 관리
  - `user`: 사용자 정보 (id, username, email)
  - `token`: JWT access 토큰
  - `refreshToken`: JWT refresh 토큰
  - `isAuthenticated`: 로그인 상태
  - `isLoading`: 로딩 상태

### 주요 메서드
- `login(email, password)`: 일반 로그인
- `signup(email, username, password)`: 회원가입
- `oauthLogin(provider, accessToken, refreshToken)`: OAuth 로그인
- `logout()`: 로그아웃
- `initializeAuth()`: 앱 시작 시 인증 상태 초기화

## 보안

### JWT 토큰 관리
- **Expo SecureStore**: iOS Keychain, Android Keystore 사용
- **Access Token**: API 호출용 토큰
- **Refresh Token**: 토큰 갱신용 토큰
- **토큰 만료**: 자동 토큰 갱신 및 만료 처리

### API 보안
- **HTTPS 통신**: 프로덕션 환경에서 필수
- **Authorization 헤더**: Bearer 토큰 포함
- **에러 처리**: 재시도 로직 및 사용자 친화적 메시지

### OAuth 보안
- **서버 기반**: OAuth 시크릿이 클라이언트에 노출되지 않음
- **리다이렉트 URI 검증**: 앱 스킴 기반 검증
- **토큰 검증**: 서버에서 발급한 토큰만 허용

## 개발 가이드

### 새로운 화면 추가
1. `app/` 디렉토리에 새 파일 생성
2. Expo Router 자동 라우팅 활용
3. 필요한 경우 `_layout.tsx`에 스택 추가

### API 호출 추가
1. `services/api.ts`에 새 메서드 추가
2. TypeScript 인터페이스 정의
3. 에러 처리 및 로딩 상태 관리

### OAuth 제공자 추가
1. `services/oauthService.ts`에 새 메서드 추가
2. OAuth 설정 및 클라이언트 ID 등록
3. 리다이렉트 URI 설정

### 상태 관리 추가
1. `stores/` 디렉토리에 새 스토어 생성
2. Zustand 패턴 따라 구현
3. 필요한 경우 persist 미들웨어 사용

## 문제 해결

### 일반적인 문제
1. **Metro 번들러 오류**: `npm start --clear`
2. **iOS 빌드 오류**: Xcode 캐시 정리
3. **Android 빌드 오류**: Gradle 캐시 정리

### 인증 관련 문제
1. **토큰 만료**: 자동으로 로그인 화면으로 이동
2. **네트워크 오류**: 재시도 로직으로 처리
3. **저장소 오류**: SecureStore 권한 확인
4. **OAuth 오류**: 클라이언트 ID 및 리다이렉트 URI 확인

### OAuth 관련 문제
1. **리다이렉트 오류**: app.json의 scheme 확인
2. **클라이언트 ID 오류**: OAuth 제공자 설정 확인
3. **토큰 교환 오류**: 서버 엔드포인트 확인

## 라이센스

MIT License

## 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
