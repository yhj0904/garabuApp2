const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Android 실제 기기에서 Metro 번들러 연결을 위한 설정
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Android 디바이스에서의 연결 디버깅
      console.log(`Request from: ${req.headers.host} - ${req.url}`);
      return middleware(req, res, next);
    };
  },
};

// 캐시 클리어를 위한 설정
config.resetCache = true;

module.exports = config;