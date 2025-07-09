import * as Haptics from 'expo-haptics';
import { TouchableOpacity } from 'react-native';

interface HapticTabProps {
  children: React.ReactNode;
  onPress?: () => void;
  [key: string]: any;
}

export function HapticTab({ children, onPress, ...props }: HapticTabProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
} 