interface Config {
  API_BASE_URL: string;
  API_VERSION: string;
  WS_BASE_URL: string;
  APP_ID: string;
  APP_VERSION: string;
}

const DEV_CONFIG: Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://101.1.13.70:8080', //192.168.10.54
  API_VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v2',
  WS_BASE_URL: process.env.EXPO_PUBLIC_WS_BASE_URL || 'ws://101.1.13.70:8080/ws-raw', //ws://192.168.10.54:8080/ws-raw
  APP_ID: 'garabu',
  APP_VERSION: '1.0.0',
};

const PROD_CONFIG: Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.garabu.app',
  API_VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v2',
  WS_BASE_URL: process.env.EXPO_PUBLIC_WS_BASE_URL || 'wss://api.garabu.app/ws-raw',
  APP_ID: 'garabu',
  APP_VERSION: '1.0.0',
};

const getConfig = (): Config => {
  if (__DEV__) {
    return DEV_CONFIG;
  }
  return PROD_CONFIG;
};

export default getConfig(); 