import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface HeatMapChartProps {
  data: {
    date: string;
    value: number;
  }[];
  year?: number;
  month?: number;
  colorScale?: string[];
}

export default function HeatMapChart({ 
  data, 
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  colorScale
}: HeatMapChartProps) {
  const { colors } = useTheme();
  
  // 기본 색상 스케일
  const defaultColorScale = [
    colors.backgroundSecondary,
    colors.primaryLight + '40',
    colors.primaryLight + '80',
    colors.primary + 'CC',
    colors.primary
  ];
  
  const scale = colorScale || defaultColorScale;
  
  // 날짜별 데이터 맵 생성
  const dataMap = new Map<string, number>();
  data.forEach(item => {
    dataMap.set(item.date, item.value);
  });
  
  // 최대값 계산
  const maxValue = Math.max(...data.map(item => item.value), 1);
  
  // 색상 인덱스 계산
  const getColorIndex = (value: number) => {
    if (value === 0) return 0;
    const ratio = value / maxValue;
    return Math.min(Math.floor(ratio * (scale.length - 1)) + 1, scale.length - 1);
  };
  
  // 월의 첫 날과 마지막 날 계산
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  // 주차별 날짜 배열 생성
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = new Array(startDayOfWeek).fill(null);
  
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  const formatDateKey = (day: number) => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  return (
    <View style={styles.container}>
      {/* 월 표시 */}
      <Text style={[styles.monthTitle, { color: colors.text }]}>
        {year}년 {monthNames[month]}
      </Text>
      
      {/* 요일 헤더 */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      {/* 날짜 그리드 */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }
            
            const dateKey = formatDateKey(day);
            const value = dataMap.get(dateKey) || 0;
            const colorIndex = getColorIndex(value);
            const cellColor = scale[colorIndex];
            
            return (
              <View
                key={dayIndex}
                style={[
                  styles.dayCell,
                  { backgroundColor: cellColor },
                  value > 0 && styles.activeDayCell
                ]}
              >
                <Text style={[styles.dayText, { color: colorIndex > 2 ? 'white' : colors.text }]}>
                  {day}
                </Text>
                {value > 0 && (
                  <Text style={[styles.valueText, { color: colorIndex > 2 ? 'white' : colors.textSecondary }]}>
                    {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
      
      {/* 범례 */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>적음</Text>
        <View style={styles.legendScale}>
          {scale.map((color, index) => (
            <View
              key={index}
              style={[styles.legendItem, { backgroundColor: color }]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>많음</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  activeDayCell: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 9,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  legendScale: {
    flexDirection: 'row',
    gap: 4,
  },
  legendItem: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});