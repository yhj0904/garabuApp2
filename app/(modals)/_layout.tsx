import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          presentation: 'modal',
          title: '모달'
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          presentation: 'modal',
          title: '프로필'
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          presentation: 'modal',
          title: '알림 설정'
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          presentation: 'modal',
          title: '앱 설정'
        }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ 
          presentation: 'modal',
          title: '도움말'
        }} 
      />
      <Stack.Screen 
        name="about" 
        options={{ 
          presentation: 'modal',
          title: '정보'
        }} 
      />
    </Stack>
  );
} 