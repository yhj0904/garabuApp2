import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';

export default function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return <BlurView intensity={80} style={{ flex: 1 }} />;
  }
  
  return <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)' }} />;
} 