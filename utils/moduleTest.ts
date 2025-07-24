/**
 * Module loading test utility
 * 이 파일은 개발 빌드에서 모듈이 제대로 로드되는지 테스트하기 위한 유틸리티입니다.
 */

import Constants from 'expo-constants';

export function testModuleLoading() {
  console.log('=== Module Loading Test ===');
  
  // Environment check
  console.log('Environment:', {
    appOwnership: Constants.appOwnership,
    executionEnvironment: Constants.executionEnvironment,
    isExpoGo: Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient',
    platform: Constants.platform,
    deviceName: Constants.deviceName
  });

  // Test Google Sign-In module
  try {
    console.log('Testing Google Sign-In module...');
    const googleModule = require('@react-native-google-signin/google-signin');
    console.log('✅ Google Sign-In module loaded successfully');
    console.log('Module exports:', Object.keys(googleModule));
    
    const { GoogleSignin, statusCodes, GoogleOneTapSignIn } = googleModule;
    console.log('Google Sign-In components:', {
      GoogleSignin: !!GoogleSignin,
      statusCodes: !!statusCodes,
      GoogleOneTapSignIn: !!GoogleOneTapSignIn,
      GoogleSigninType: typeof GoogleSignin,
      GoogleSigninMethods: GoogleSignin ? Object.getOwnPropertyNames(Object.getPrototypeOf(GoogleSignin)) : null
    });
    
    return true;
  } catch (error) {
    console.error('❌ Google Sign-In module loading failed:', error);
    return false;
  }
}

export function testFirebaseModules() {
  console.log('=== Firebase Module Test ===');
  
  // Test Firebase modules
  const modules = [
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    '@react-native-firebase/analytics',
    '@react-native-firebase/crashlytics'
  ];
  
  const results: Record<string, boolean> = {};
  
  modules.forEach(moduleName => {
    try {
      const module = require(moduleName);
      console.log(`✅ ${moduleName} loaded successfully`);
      results[moduleName] = true;
    } catch (error) {
      console.error(`❌ ${moduleName} loading failed:`, error);
      results[moduleName] = false;
    }
  });
  
  return results;
}

export function testKakaoModule() {
  console.log('=== Kakao Module Test ===');
  
  try {
    const kakaoCore = require('@react-native-kakao/core');
    console.log('✅ Kakao Core module loaded successfully');
    console.log('Kakao exports:', Object.keys(kakaoCore));
    return true;
  } catch (error) {
    console.error('❌ Kakao module loading failed:', error);
    return false;
  }
}

// Run all tests
export function runAllModuleTests() {
  console.log('\n🔍 Starting comprehensive module tests...\n');
  
  const results = {
    google: testModuleLoading(),
    firebase: testFirebaseModules(),
    kakao: testKakaoModule()
  };
  
  console.log('\n📊 Module Test Results:', results);
  return results;
}