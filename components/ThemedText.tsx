import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'button';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'success' | 'error' | 'warning';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  type = 'body', 
  variant = 'primary',
  weight = 'normal',
  style, 
  children, 
  ...props 
}) => {
  const { colors } = useTheme();

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.text;
      case 'secondary':
        return colors.textSecondary;
      case 'tertiary':
        return colors.textTertiary;
      case 'inverse':
        return colors.textInverse;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.text;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return {
          fontSize: 28,
          lineHeight: 36,
          fontWeight: 'bold' as const,
        };
      case 'subtitle':
        return {
          fontSize: 20,
          lineHeight: 28,
          fontWeight: 'semibold' as const,
        };
      case 'body':
        return {
          fontSize: 16,
          lineHeight: 24,
          fontWeight: weight,
        };
      case 'caption':
        return {
          fontSize: 14,
          lineHeight: 20,
          fontWeight: weight,
        };
      case 'label':
        return {
          fontSize: 14,
          lineHeight: 20,
          fontWeight: 'medium' as const,
        };
      case 'button':
        return {
          fontSize: 16,
          lineHeight: 24,
          fontWeight: 'semibold' as const,
        };
      default:
        return {
          fontSize: 16,
          lineHeight: 24,
          fontWeight: weight,
        };
    }
  };

  return (
    <Text
      style={[
        getTextStyle(),
        {
          color: getTextColor(),
          fontFamily: 'System',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}; 