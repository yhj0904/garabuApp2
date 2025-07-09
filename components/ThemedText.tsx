import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'defaultSemiBold' | 'default';
}

export function ThemedText({ type = 'default', style, ...props }: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 24, fontWeight: 'bold' as const, color: colors.text };
      case 'subtitle':
        return { fontSize: 18, fontWeight: '600' as const, color: colors.text };
      case 'defaultSemiBold':
        return { fontSize: 16, fontWeight: '600' as const, color: colors.text };
      default:
        return { fontSize: 16, color: colors.text };
    }
  };

  return <Text style={[getTextStyle(), style]} {...props} />;
} 