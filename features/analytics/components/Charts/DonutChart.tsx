import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  centerText?: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function DonutChart({ 
  data, 
  size = 200, 
  strokeWidth = 40,
  showLabels = true,
  showPercentage = true,
  centerText
}: DonutChartProps) {
  const { colors } = useTheme();
  const animationValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [data]);
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          데이터가 없습니다
        </Text>
      </View>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let cumulativeAngle = -Math.PI / 2; // 12시 방향부터 시작
  
  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startAngleOuter = startAngle;
    const endAngleOuter = endAngle;
    
    const x1 = center + outerRadius * Math.cos(startAngleOuter);
    const y1 = center + outerRadius * Math.sin(startAngleOuter);
    const x2 = center + outerRadius * Math.cos(endAngleOuter);
    const y2 = center + outerRadius * Math.sin(endAngleOuter);
    
    const x3 = center + innerRadius * Math.cos(endAngleOuter);
    const y3 = center + innerRadius * Math.sin(endAngleOuter);
    const x4 = center + innerRadius * Math.cos(startAngleOuter);
    const y4 = center + innerRadius * Math.sin(startAngleOuter);
    
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  };
  
  const arcs = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    
    const path = createArcPath(
      startAngle,
      endAngle,
      radius - strokeWidth,
      radius
    );
    
    // 라벨 위치 계산
    const labelAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius - strokeWidth / 2;
    const labelX = center + labelRadius * Math.cos(labelAngle);
    const labelY = center + labelRadius * Math.sin(labelAngle);
    
    cumulativeAngle = endAngle;
    
    return {
      path,
      percentage,
      labelX,
      labelY,
      color: item.color,
      label: item.label,
      value: item.value
    };
  });
  
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
          <G>
            {arcs.map((arc, index) => (
              <AnimatedPath
                key={index}
                d={arc.path}
                fill={arc.color}
                opacity={animationValue}
              />
            ))}
            
            {showPercentage && arcs.map((arc, index) => (
              arc.percentage > 0.05 && ( // 5% 이상만 표시
                <SvgText
                  key={`label-${index}`}
                  x={arc.labelX}
                  y={arc.labelY}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {`${Math.round(arc.percentage * 100)}%`}
                </SvgText>
              )
            ))}
          </G>
        </Svg>
        
        {/* 중앙 텍스트 */}
        {centerText && (
          <View style={[styles.centerTextContainer, { width: size, height: size }]}>
            <Text style={[styles.centerText, { color: colors.text }]}>
              {centerText}
            </Text>
          </View>
        )}
      </View>
      
      {/* 범례 */}
      {showLabels && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {formatValue(item.value)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  legend: {
    marginTop: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
  },
  legendValue: {
    fontSize: 14,
    marginLeft: 8,
  },
});