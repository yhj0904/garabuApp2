import { Stack } from 'expo-router';

export default function FriendsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '친구',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="requests" 
        options={{ 
          title: '친구 요청',
          headerShown: true,
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="groups" 
        options={{ 
          title: '친구 그룹',
          headerShown: true,
          presentation: 'modal' 
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          title: '친구 추가',
          headerShown: true,
          presentation: 'modal' 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: '친구 상세',
          headerShown: true,
          presentation: 'modal' 
        }} 
      />
    </Stack>
  );
}