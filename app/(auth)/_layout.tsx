import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Stack>
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            title: '로그인'
          }} 
        />
        <Stack.Screen 
          name="signup" 
          options={{ 
            headerShown: false,
            title: '회원가입'
          }} 
        />
      </Stack>
    </SafeAreaView>
  );
} 