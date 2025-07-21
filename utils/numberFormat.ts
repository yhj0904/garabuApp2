/**
 * 숫자 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 쉼표가 포함된 문자열로 변환
 * @param value - 숫자 또는 숫자 문자열
 * @returns 쉼표가 포함된 문자열 (예: "1,000,000")
 */
export const formatNumberWithCommas = (value: string | number): string => {
  // 숫자가 아닌 문자 제거
  const numericValue = String(value).replace(/[^0-9]/g, '');
  
  if (!numericValue) return '';
  
  // 쉼표 추가
  return parseInt(numericValue).toLocaleString('ko-KR');
};

/**
 * 쉼표가 포함된 문자열을 숫자로 변환
 * @param formattedValue - 쉼표가 포함된 문자열 (예: "1,000,000")
 * @returns 숫자
 */
export const parseFormattedNumber = (formattedValue: string): number => {
  // 쉼표 제거 후 숫자로 변환
  const numericValue = formattedValue.replace(/,/g, '');
  return parseInt(numericValue) || 0;
};

/**
 * 숫자를 한국어로 변환
 * @param value - 숫자 또는 숫자 문자열
 * @returns 한국어 숫자 문자열 (예: "백만원")
 */
export const formatKoreanAmount = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFormattedNumber(value) : value;
  
  if (num === 0) return '0원';
  
  const units = [
    { value: 1000000000000, unit: '조' },
    { value: 100000000, unit: '억' },
    { value: 10000, unit: '만' },
    { value: 1000, unit: '천' },
  ];
  
  let result = '';
  let remaining = num;
  
  for (const { value: unitValue, unit } of units) {
    if (remaining >= unitValue) {
      const count = Math.floor(remaining / unitValue);
      if (count > 0) {
        result += count + unit;
        remaining %= unitValue;
      }
    }
  }
  
  if (remaining > 0) {
    result += remaining;
  }
  
  return result + '원';
};

/**
 * 입력값을 실시간으로 포맷팅
 * @param input - 사용자 입력값
 * @returns 포맷팅된 문자열
 */
export const formatInputAmount = (input: string): string => {
  // 숫자와 쉼표만 허용
  const cleaned = input.replace(/[^0-9,]/g, '');
  
  // 쉼표 제거 후 숫자로 변환
  const numericValue = cleaned.replace(/,/g, '');
  
  if (!numericValue) return '';
  
  // 숫자가 너무 크면 제한 (999조)
  const maxValue = 999999999999999;
  const limitedValue = Math.min(parseInt(numericValue), maxValue);
  
  // 쉼표 추가
  return limitedValue.toLocaleString('ko-KR');
};

/**
 * 금액 입력 필드용 포맷터
 * @param text - 입력 텍스트
 * @returns 포맷팅된 텍스트
 */
export const formatAmountInput = (text: string): string => {
  // 빈 문자열 처리
  if (!text.trim()) return '';
  
  // 숫자만 추출
  const numericText = text.replace(/[^0-9]/g, '');
  
  if (!numericText) return '';
  
  // 숫자로 변환
  const number = parseInt(numericText);
  
  // 최대값 제한 (999조)
  const maxValue = 999999999999999;
  const limitedNumber = Math.min(number, maxValue);
  
  // 한국어 로케일로 포맷팅
  return limitedNumber.toLocaleString('ko-KR');
};

/**
 * 금액 표시용 포맷터 (₩ 기호 포함)
 * @param value - 숫자 또는 문자열
 * @returns ₩ 기호가 포함된 포맷팅된 문자열
 */
export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFormattedNumber(value) : value;
  return `₩${num.toLocaleString('ko-KR')}`;
};

/**
 * 입력값이 유효한 금액인지 확인
 * @param value - 입력값
 * @returns 유효성 여부
 */
export const isValidAmount = (value: string): boolean => {
  const numericValue = value.replace(/[^0-9]/g, '');
  const number = parseInt(numericValue);
  
  return number >= 0 && number <= 999999999999999;
}; 