import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
}

export const ThemedInput: React.FC<ThemedInputProps> = ({ 
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  style,
  ...props 
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      minHeight: 48,
    };

    const variantStyle = {
      default: {
        backgroundColor: colors.input,
        borderWidth: 1,
        borderColor: isFocused ? colors.inputFocus : colors.inputBorder,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: isFocused ? colors.inputFocus : colors.border,
      },
      filled: {
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...variantStyle[variant],
    };
  };

  const getContainerStyle = () => {
    return {
      marginBottom: 16,
    };
  };

  return (
    <View style={getContainerStyle()}>
      {label && (
        <ThemedText 
          type="label" 
          variant="secondary" 
          style={{ marginBottom: 8 }}
        >
          {label}
        </ThemedText>
      )}
      
      <View style={{ position: 'relative' }}>
        {leftIcon && (
          <View style={[styles.iconContainer, { left: 12 }]}>
            <Ionicons 
              name={leftIcon} 
              size={20} 
              color={colors.textTertiary} 
            />
          </View>
        )}
        
        <TextInput
          style={[
            getInputStyle(),
            leftIcon && { paddingLeft: 44 },
            rightIcon && { paddingRight: 44 },
            error && { borderColor: colors.error },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={[styles.iconContainer, { right: 12 }]}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={onRightIconPress ? colors.primary : colors.textTertiary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <ThemedText 
          type="caption" 
          variant="error" 
          style={{ marginTop: 4 }}
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
}); 