import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModalLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
        <Stack.Screen name="index"         options={{ title: '모달' }} />
        <Stack.Screen name="profile"       options={{ title: '프로필' }} />
        <Stack.Screen name="notifications" options={{ title: '알림 설정' }} />
        <Stack.Screen name="settings"      options={{ title: '앱 설정' }} />
        <Stack.Screen name="help"          options={{ title: '도움말' }} />
        <Stack.Screen name="about"         options={{ title: '정보' }} />
        <Stack.Screen name="add-transaction" options={{ title: '거래 추가' }} />
        <Stack.Screen name="book-creation" options={{ title: '가계부 생성' }} />
        <Stack.Screen name="select-book"   options={{ title: '가계부 선택' }} />
        <Stack.Screen name="book-sharing"  options={{ title: '가계부 공유' }} />
        <Stack.Screen name="advanced-stats" options={{ title: '고급 통계' }} />
        <Stack.Screen name="budget-settings" options={{ title: '예산 설정' }} />
        <Stack.Screen name="change-password" options={{ title: '비밀번호 변경' }} />
        <Stack.Screen name="manage-categories" options={{ title: '카테고리 관리' }} />
        <Stack.Screen name="user-id-code" options={{ title: '사용자 ID 코드' }} />
        <Stack.Screen name="add-asset" options={{ title: '자산 추가' }} />
        <Stack.Screen name="asset-detail" options={{ title: '자산 상세' }} />
        <Stack.Screen name="book-settings" options={{ title: '가계부 설정' }} />
        <Stack.Screen name="invite-code" options={{ title: '초대 코드' }} />
        <Stack.Screen name="join-book" options={{ title: '가계부 참여' }} />
        <Stack.Screen name="add-category" options={{ title: '카테고리 추가' }} />
        <Stack.Screen name="currencies" options={{ title: '통화 설정' }} />
        <Stack.Screen name="edit-asset" options={{ title: '자산 편집' }} />
        <Stack.Screen name="goals" options={{ title: '목표' }} />
        <Stack.Screen name="notification-settings" options={{ title: '알림 설정' }} />
        <Stack.Screen name="recurring-transactions" options={{ title: '반복 거래' }} />
        <Stack.Screen name="tags" options={{ title: '태그 관리' }} />
      </Stack>
    </SafeAreaView>
  );
}
