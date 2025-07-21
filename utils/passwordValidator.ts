interface PasswordValidation {
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
  message: string;
}

export const validatePassword = (password: string): PasswordValidation => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // 조건 충족 개수 계산
  const fulfilledCount = Object.values(requirements).filter(Boolean).length;
  
  // 최소 요구사항: 8자 이상 + 2가지 이상 조건
  const categoryCount = [
    requirements.hasUpperCase || requirements.hasLowerCase,
    requirements.hasNumber,
    requirements.hasSpecialChar
  ].filter(Boolean).length;
  
  const isValid = requirements.minLength && categoryCount >= 2;

  // 강도 계산
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (fulfilledCount >= 4) {
    strength = 'strong';
  } else if (fulfilledCount >= 3) {
    strength = 'medium';
  }

  // 메시지 생성
  let message = '';
  if (!requirements.minLength) {
    message = '비밀번호는 최소 8자 이상이어야 합니다';
  } else if (categoryCount < 2) {
    message = '영문 대/소문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다';
  } else if (strength === 'weak') {
    message = '더 강력한 비밀번호를 사용하세요';
  } else if (strength === 'medium') {
    message = '적절한 비밀번호입니다';
  } else {
    message = '강력한 비밀번호입니다';
  }

  return {
    isValid,
    requirements,
    strength,
    message
  };
};

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return '#FF4444';
    case 'medium':
      return '#FFA500';
    case 'strong':
      return '#00C851';
    default:
      return '#999999';
  }
};