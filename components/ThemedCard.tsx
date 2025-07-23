import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ 
  children, 
  variant = 'default',
  onPress,
  onLongPress,
  disabled = false,
  style, 
  ...props 
}) => {
  const { colors } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.card,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.cardElevated,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
}; 