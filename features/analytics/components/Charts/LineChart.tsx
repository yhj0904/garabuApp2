import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface LineChartProps {
  data: {
    label: string;
    value: number;
  }[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  curved?: boolean;
  gradient?: boolean;
}

export default function LineChart({ 
  data, 
  height = 200, 
  showGrid = true,
  showDots = true,
  curved = true,
  gradient = true
}: LineChartProps) {
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
  
  // 데이터 정규화
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const range = maxValue - minValue || 1;
  
  // 포인트 계산
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * chartWidth,
    y: chartHeight - ((item.value - minValue) / range) * chartHeight,
    value: item.value,
    label: item.label
  }));
  
  // 곡선 경로 생성
  const createPath = () => {
    if (!curved) {
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }
    
    // 베지어 곡선 생성
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const xMid = (points[i - 1].x + points[i].x) / 2;
      const yMid = (points[i - 1].y + points[i].y) / 2;
      const cp1x = (xMid + points[i - 1].x) / 2;
      const cp1y = points[i - 1].y;
      const cp2x = (xMid + points[i].x) / 2;
      const cp2y = points[i].y;
      
      path += ` Q ${cp1x},${cp1y} ${xMid},${yMid}`;
      path += ` Q ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    
    return path;
  };
  
  const linePath = createPath();
  const areaPath = gradient ? `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : '';

  // Y축 레이블 생성
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const value = minValue + range * ratio;
    return {
      value: value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
             value >= 1000 ? `${(value / 1000).toFixed(0)}k` : 
             value.toFixed(0),
      y: chartHeight - ratio * chartHeight
    };
  });

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      <Svg width={chartWidth + padding * 2} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.1" />
          </LinearGradient>
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
          
          {/* 그라데이션 영역 */}
          {gradient && (
            <Path
              d={areaPath}
              fill="url(#gradient)"
            />
          )}
          
          {/* 라인 */}
          <Path
            d={linePath}
            fill="none"
            stroke={colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 데이터 포인트 */}
          {showDots && points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={colors.background}
                stroke={colors.primary}
                strokeWidth="3"
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={colors.primary}
              />
            </G>
          ))}
          
          {/* X축 레이블 */}
          {points.map((point, index) => (
            <SvgText
              key={index}
              x={point.x}
              y={chartHeight + 20}
              fill={colors.textSecondary}
              fontSize="10"
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          ))}
        </G>
      </Svg>
      
      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            금액 추이
          </Text>
        </View>
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
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});