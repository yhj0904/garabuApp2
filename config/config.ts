interface Config {
  API_BASE_URL: string;
  API_VERSION: string;
  WS_BASE_URL: string;
  APP_ID: string;
  APP_VERSION: string;
  GOOGLE_OAUTH_CLIENT_ID?: string;
  NAVER_OAUTH_CLIENT_ID?: string;
  USE_MOCK_API: boolean;
}

const DEV_CONFIG: Config = {
  API_BASE_URL: 'http://localhost:8080',//'http://192.168.10.54:8080', //'http://101.1.13.107:8080',
  API_VERSION: 'v2',
  WS_BASE_URL: 'ws://localhost:8080/ws',//'ws://192.168.10.54:8080/ws', // 'ws://101.1.13.107:8080/ws',
  APP_ID: 'garabu',
  APP_VERSION: '1.0.0',
  GOOGLE_OAUTH_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  NAVER_OAUTH_CLIENT_ID: process.env.EXPO_PUBLIC_NAVER_OAUTH_CLIENT_ID,
  USE_MOCK_API: false, // 개발용 Mock API 사용
};

const PROD_CONFIG: Config = {
  API_BASE_URL: 'https://api.garabu.com', // 실제 프로덕션 URL로 변경 필요
  API_VERSION: 'v2',
  WS_BASE_URL: 'wss://api.garabu.com/ws',
  APP_ID: 'garabu',
  APP_VERSION: '1.0.0',
  GOOGLE_OAUTH_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  NAVER_OAUTH_CLIENT_ID: process.env.EXPO_PUBLIC_NAVER_OAUTH_CLIENT_ID,
  USE_MOCK_API: false,
};

const getConfig = (): Config => {
  if (__DEV__) {
    return DEV_CONFIG;
  }
  return PROD_CONFIG;
};

export default getConfig(); 