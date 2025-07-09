import { Text } from 'react-native';

interface IconSymbolProps {
  name: string;
  size: number;
  color: string;
}

export function IconSymbol({ name, size, color }: IconSymbolProps) {
  // 간단한 이모지 아이콘으로 대체
  const getIcon = (name: string) => {
    switch (name) {
      case 'house.fill':
        return '🏠';
      case 'paperplane.fill':
        return '✈️';
      case 'gearshape.fill':
        return '⚙️';
      default:
        return '📱';
    }
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {getIcon(name)}
    </Text>
  );
} 