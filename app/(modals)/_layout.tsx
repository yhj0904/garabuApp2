import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
        <Stack.Screen name="index"         options={{ title: '모달' }} />
        <Stack.Screen name="profile"       options={{ title: '프로필' }} />
        <Stack.Screen name="notifications" options={{ title: '알림 설정' }} />
        <Stack.Screen name="settings"      options={{ title: '앱 설정' }} />
        <Stack.Screen name="help"          options={{ title: '도움말' }} />
        <Stack.Screen name="about"         options={{ title: '정보' }} />
        <Stack.Screen name="add-transaction" options={{ title: '거래 추가' }} />
        <Stack.Screen name="add-book"      options={{ title: '가계부 추가' }} />
        <Stack.Screen name="add-category"  options={{ title: '카테고리 추가' }} />
        <Stack.Screen name="select-book"   options={{ title: '가계부 선택' }} />
        <Stack.Screen name="book-sharing"  options={{ title: '가계부 공유' }} />
        <Stack.Screen name="advanced-stats" options={{ title: '고급 통계' }} />
        <Stack.Screen name="change-password" options={{ title: '비밀번호 변경' }} />
      </Stack>
  );
}
