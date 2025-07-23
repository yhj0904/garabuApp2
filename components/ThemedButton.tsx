import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style, 
  ...props 
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    };

    const sizeStyle = {
      small: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        minHeight: 52,
      },
    };

    const variantStyle = {
      primary: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: {
        backgroundColor: colors.error,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyle[size],
      ...variantStyle[variant],
    };
  };

  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.textInverse;
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };

  const getTextVariant = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return 'primary' as const;
      default:
        return 'inverse' as const;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && { opacity: 0.5 },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
          style={{ marginRight: 8 }}
        />
      ) : null}
      <ThemedText
        type="button"
        variant={getTextVariant()}
        style={{ color: getTextColor() }}
      >
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
}; 