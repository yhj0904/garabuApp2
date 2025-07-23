import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Path, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface StackedAreaChartProps {
  data: {
    date: string;
    categories: {
      name: string;
      value: number;
      color: string;
    }[];
  }[];
  height?: number;
  showGrid?: boolean;
}

export default function StackedAreaChart({ 
  data, 
  height = 250,
  showGrid = true
}: StackedAreaChartProps) {
  const { colors } = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          데이터가 없습니다
        </Text>
      </View>
    );
  }

  const padding = 40;
  const chartWidth = 300;
  const chartHeight = height - padding * 2;
  
  // 카테고리 목록 생성
  const categoryNames = Array.from(new Set(
    data.flatMap(d => d.categories.map(c => c.name))
  ));
  
  // 각 날짜별로 누적 데이터 계산
  const stackedData = data.map((dateData, dateIndex) => {
    let cumulativeValue = 0;
    const stacks = categoryNames.map(categoryName => {
      const category = dateData.categories.find(c => c.name === categoryName);
      const value = category ? category.value : 0;
      const color = category ? category.color : colors.textSecondary;
      
      const startY = cumulativeValue;
      cumulativeValue += value;
      
      return {
        name: categoryName,
        value,
        color,
        startY,
        endY: cumulativeValue
      };
    });
    
    return {
      date: dateData.date,
      x: (dateIndex / (data.length - 1)) * chartWidth,
      stacks,
      total: cumulativeValue
    };
  });
  
  // 최대값 계산
  const maxValue = Math.max(...stackedData.map(d => d.total), 1);
  
  // Y축 스케일 함수
  const scaleY = (value: number) => chartHeight - (value / maxValue) * chartHeight;
  
  // 각 카테고리별로 area path 생성
  const areaPaths = categoryNames.map(categoryName => {
    const points = stackedData.map(d => {
      const stack = d.stacks.find(s => s.name === categoryName)!;
      return {
        x: d.x,
        upperY: scaleY(stack.endY),
        lowerY: scaleY(stack.startY)
      };
    });
    
    // 상단 경로
    const upperPath = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.upperY}`
    ).join(' ');
    
    // 하단 경로 (역순)
    const lowerPath = points.slice().reverse().map((p, i) => 
      `${i === 0 ? 'L' : 'L'} ${p.x} ${p.lowerY}`
    ).join(' ');
    
    const path = `${upperPath} ${lowerPath} Z`;
    const color = stackedData[0].stacks.find(s => s.name === categoryName)?.color || colors.textSecondary;
    
    return { path, color, name: categoryName };
  });
  
  // Y축 레이블 생성
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const value = maxValue * ratio;
    return {
      value: value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
             value >= 1000 ? `${(value / 1000).toFixed(0)}k` : 
             value.toFixed(0),
      y: scaleY(value)
    };
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { height: height + 60 }]}>
      <Svg width={chartWidth + padding * 2} height={height}>
        <Defs>
          {areaPaths.map((area, index) => (
            <LinearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={area.color} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={area.color} stopOpacity="0.4" />
            </LinearGradient>
          ))}
        </Defs>
        
        <G transform={`translate(${padding}, ${padding})`}>
          {/* 그리드 라인 */}
          {showGrid && yLabels.map((label, index) => (
            <Line
              key={index}
              x1={0}
              y1={label.y}
              x2={chartWidth}
              y2={label.y}
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
          ))}
          
          {/* Y축 레이블 */}
          {yLabels.map((label, index) => (
            <SvgText
              key={index}
              x={-10}
              y={label.y + 5}
              fill={colors.textSecondary}
              fontSize="10"
              textAnchor="end"
            >
              {label.value}
            </SvgText>
          ))}
          
          {/* 영역 그리기 (뒤에서부터 그려서 겹치게) */}
          {areaPaths.reverse().map((area, index) => (
            <Path
              key={index}
              d={area.path}
              fill={`url(#gradient-${areaPaths.length - 1 - index})`}
              opacity="0.9"
            />
          ))}
          
          {/* X축 레이블 */}
          {stackedData.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((point) => (
            <SvgText
              key={point.date}
              x={point.x}
              y={chartHeight + 20}
              fill={colors.textSecondary}
              fontSize="10"
              textAnchor="middle"
            >
              {formatDate(point.date)}
            </SvgText>
          ))}
        </G>
      </Svg>
      
      {/* 범례 */}
      <View style={styles.legend}>
        {categoryNames.map(name => {
          const color = stackedData[0].stacks.find(s => s.name === name)?.color || colors.textSecondary;
          return (
            <View key={name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
});