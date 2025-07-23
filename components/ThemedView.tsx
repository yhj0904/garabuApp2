import { useTheme } from '@/contexts/ThemeContext';
import { View, ViewProps } from 'react-native';

export function ThemedView({ style, ...props }: ViewProps) {
  const { colors } = useTheme();

  return <View style={[{ backgroundColor: colors.background }, style]} {...props} />;
} 