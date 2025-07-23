import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { validatePassword, getPasswordStrengthColor } from '@/utils/passwordValidator';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showRequirements = false 
}) => {
  const { colors } = useTheme();
  
  if (!password) return null;
  
  const validation = validatePassword(password);
  const strengthColor = getPasswordStrengthColor(validation.strength);
  
  // 강도 표시 바의 너비 계산
  const strengthPercentage = validation.strength === 'weak' ? '33%' : 
                           validation.strength === 'medium' ? '66%' : '100%';
  
  return (
    <View style={styles.container}>
      {/* 강도 표시 바 */}
      <View style={styles.strengthBarContainer}>
        <View style={[styles.strengthBarBackground, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.strengthBarFill, 
              { 
                width: strengthPercentage, 
                backgroundColor: strengthColor 
              }
            ]} 
          />
        </View>
        <Text style={[styles.strengthText, { color: strengthColor }]}>
          {validation.strength === 'weak' ? '약함' : 
           validation.strength === 'medium' ? '보통' : '강함'}
        </Text>
      </View>
      
      {/* 메시지 */}
      <Text style={[styles.message, { color: validation.isValid ? colors.icon : strengthColor }]}>
        {validation.message}
      </Text>
      
      {/* 상세 요구사항 (옵션) */}
      {showRequirements && (
        <View style={styles.requirementsContainer}>
          <RequirementItem 
            met={validation.requirements.minLength} 
            text="최소 8자 이상" 
            colors={colors}
          />
          <RequirementItem 
            met={validation.requirements.hasUpperCase || validation.requirements.hasLowerCase} 
            text="영문 포함" 
            colors={colors}
          />
          <RequirementItem 
            met={validation.requirements.hasNumber} 
            text="숫자 포함" 
            colors={colors}
          />
          <RequirementItem 
            met={validation.requirements.hasSpecialChar} 
            text="특수문자 포함" 
            colors={colors}
          />
        </View>
      )}
    </View>
  );
};

const RequirementItem: React.FC<{
  met: boolean;
  text: string;
  colors: typeof Colors.light;
}> = ({ met, text, colors }) => (
  <View style={styles.requirementItem}>
    <Ionicons 
      name={met ? "checkmark-circle" : "close-circle"} 
      size={16} 
      color={met ? '#00C851' : colors.icon} 
    />
    <Text style={[
      styles.requirementText, 
      { 
        color: met ? colors.text : colors.icon,
        fontWeight: met ? '500' : '400'
      }
    ]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  message: {
    fontSize: 12,
    marginBottom: 8,
  },
  requirementsContainer: {
    marginTop: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 6,
  },
});