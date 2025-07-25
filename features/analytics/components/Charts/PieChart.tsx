import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface PieChartData {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  data: PieChartData[];
  radius?: number;
  showLabels?: boolean;
  centerText?: string;
  centerSubtext?: string;
  showPercentage?: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function PieChart({ 
  data, 
  radius = 100, 
  showLabels = true,
  centerText,
  centerSubtext,
  showPercentage = true
}: PieChartProps) {
  const { colors, isDarkMode } = useTheme();
  const animationValue = useRef(new Animated.Value(0)).current;
  const size = radius * 2 + 40; // 패딩 포함
  const center = size / 2;
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  useEffect(() => {
    animationValue.setValue(0);
    Animated.spring(animationValue, {
      toValue: 1,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [data]);
  
  if (totalValue === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill={isDarkMode ? colors.card : colors.backgroundSecondary}
            stroke={colors.border}
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.5}
          />
        </Svg>
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>데이터 없음</Text>
        </View>
      </View>
    );
  }

  let cumulativeAngle = -Math.PI / 2; // 12시 방향부터 시작
  const slices = data.map((item, index) => {
    const percentage = (item.value / totalValue);
    const angle = percentage * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    
    // 큰 호 플래그 계산
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    // 시작점
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    
    // 끝점
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    
    // 라벨 위치 (중간 각도)
    const midAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = center + labelRadius * Math.cos(midAngle);
    const labelY = center + labelRadius * Math.sin(midAngle);
    
    // 애니메이션을 위한 경로
    const animatedEndAngle = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [startAngle, endAngle],
    });
    
    cumulativeAngle = endAngle;
    
    return {
      pathData: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: item.color,
      percentage: percentage * 100,
      label: item.label,
      value: item.value,
      labelX,
      labelY,
      startAngle,
      endAngle,
      animatedEndAngle,
    };
  });

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 그림자 효과 */}
          <Circle
            cx={center + 2}
            cy={center + 2}
            r={radius}
            fill="rgba(0,0,0,0.1)"
            opacity={0.3}
          />
          
          <G>
            {slices.map((slice, index) => {
              // 애니메이션 경로 계산
              const animatedX2 = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  center + radius * Math.cos(slice.startAngle),
                  center + radius * Math.cos(slice.endAngle),
                ],
              });
              const animatedY2 = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  center + radius * Math.sin(slice.startAngle),
                  center + radius * Math.sin(slice.endAngle),
                ],
              });
              
              const largeArcFlag = slice.endAngle - slice.startAngle > Math.PI ? 1 : 0;
              
              return (
                <AnimatedPath
                  key={index}
                  d={`M ${center} ${center} L ${center + radius * Math.cos(slice.startAngle)} ${center + radius * Math.sin(slice.startAngle)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${animatedX2} ${animatedY2} Z`}
                  fill={slice.color}
                  stroke={colors.background}
                  strokeWidth={2}
                  opacity={animationValue}
                />
              );
            })}
          </G>
          
          {/* 퍼센티지 라벨 */}
          {showPercentage && slices.map((slice, index) => {
            if (slice.percentage < 5) return null; // 5% 미만은 표시하지 않음
            
            return (
              <G key={`label-${index}`}>
                <Circle
                  cx={slice.labelX}
                  cy={slice.labelY}
                  r={20}
                  fill={slice.color}
                  opacity={0.9}
                />
                <SvgText
                  x={slice.labelX}
                  y={slice.labelY}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {Math.round(slice.percentage)}%
                </SvgText>
              </G>
            );
          })}
        </Svg>
        
        {/* 중앙 콘텐츠 */}
        {(centerText || centerSubtext) && (
          <Animated.View 
            style={[
              styles.centerContent, 
              { 
                width: size, 
                height: size,
                opacity: animationValue,
                transform: [{
                  scale: animationValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.1, 1],
                  }),
                }],
              }
            ]}
          >
            {centerText && (
              <Text style={[styles.centerText, { color: colors.text }]}>{centerText}</Text>
            )}
            {centerSubtext && (
              <Text style={[styles.centerSubtext, { color: colors.textSecondary }]}>{centerSubtext}</Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* 범례 */}
      {showLabels && (
        <Animated.View 
          style={[
            styles.legend,
            {
              opacity: animationValue,
              transform: [{
                translateY: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]}>
                  <View style={[styles.legendInnerDot, { backgroundColor: colors.background }]} />
                </View>
                <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendValue, { color: colors.text }]}>
                  ₩{formatValue(item.value)}
                </Text>
                <Text style={[styles.legendPercentage, { color: colors.textSecondary }]}>
                  ({((item.value / totalValue) * 100).toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const SvgText = Animated.createAnimatedComponent(G).Text;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
  },
  centerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  legend: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 14,
    flex: 1,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendPercentage: {
    fontSize: 12,
  },
});