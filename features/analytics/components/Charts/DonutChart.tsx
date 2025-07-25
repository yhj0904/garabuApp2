import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
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
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DonutChart({ 
  data, 
  size = 240, 
  strokeWidth = 60,
  showLabels = true,
  showPercentage = true,
  centerText
}: DonutChartProps) {
  const { colors, isDarkMode } = useTheme();
  const animationValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // 애니메이션 리셋
    animationValue.setValue(0);
    opacityValue.setValue(0);
    
    // 순차적 애니메이션
    Animated.sequence([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(animationValue, {
        toValue: 1,
        speed: 8,
        bounciness: 12,
        useNativeDriver: false,
      }),
    ]).start();
  }, [data]);
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            fill="none"
            stroke={colors.border}
            strokeWidth={strokeWidth}
            strokeDasharray="5,5"
            opacity={0.3}
          />
        </Svg>
        <View style={[styles.centerTextContainer, { width: size, height: size }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            데이터가 없습니다
          </Text>
        </View>
      </View>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let cumulativeValue = 0;
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const segmentLength = percentage * circumference;
    const offset = (cumulativeValue / total) * circumference;
    
    cumulativeValue += item.value;
    
    return {
      ...item,
      percentage,
      segmentLength,
      offset,
      strokeDashoffset: animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, circumference - segmentLength],
      }),
      rotation: animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [`${(offset / circumference) * 360 - 90}deg`, `${(offset / circumference) * 360 - 90}deg`],
      }),
    };
  });
  
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <Animated.View style={[styles.container, { opacity: opacityValue }]}>
      <View style={{ width: size, height: size }}>
        {/* 배경 원 */}
        <Svg 
          width={size} 
          height={size} 
          style={StyleSheet.absoluteFillObject}
        >
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isDarkMode ? colors.card : colors.backgroundSecondary}
            strokeWidth={strokeWidth}
          />
        </Svg>
        
        {/* 도넛 세그먼트 */}
        {segments.map((segment, index) => (
          <Animated.View
            key={index}
            style={[
              StyleSheet.absoluteFillObject,
              {
                transform: [{ rotate: segment.rotation }],
              },
            ]}
          >
            <Svg width={size} height={size}>
              <AnimatedCircle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segment.segmentLength} ${circumference}`}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        ))}
        
        {/* 세그먼트 구분선 */}
        {data.length > 1 && segments.map((segment, index) => {
          const angle = (cumulativeValue / total) * 2 * Math.PI - Math.PI / 2;
          const x1 = center + (radius - strokeWidth / 2) * Math.cos(angle);
          const y1 = center + (radius - strokeWidth / 2) * Math.sin(angle);
          const x2 = center + (radius + strokeWidth / 2) * Math.cos(angle);
          const y2 = center + (radius + strokeWidth / 2) * Math.sin(angle);
          
          return (
            <Svg
              key={`divider-${index}`}
              width={size}
              height={size}
              style={StyleSheet.absoluteFillObject}
            >
              <Path
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={colors.background}
                strokeWidth={2}
              />
            </Svg>
          );
        })}
        
        {/* 중앙 텍스트 */}
        {centerText && (
          <View style={[styles.centerTextContainer, { width: size, height: size }]}>
            <Animated.Text 
              style={[
                styles.centerText, 
                { 
                  color: colors.text,
                  transform: [{
                    scale: animationValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.1, 1],
                    }),
                  }],
                }
              ]}
            >
              {centerText}
            </Animated.Text>
            <Text style={[styles.centerSubtext, { color: colors.textSecondary }]}>
              총 {data.length}개 항목
            </Text>
          </View>
        )}
        
        {/* 퍼센티지 라벨 */}
        {showPercentage && segments.map((segment, index) => {
          if (segment.percentage < 0.05) return null; // 5% 미만은 표시하지 않음
          
          const angle = ((segment.offset + segment.segmentLength / 2) / circumference) * 2 * Math.PI - Math.PI / 2;
          const labelRadius = radius + strokeWidth / 2 + 20;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          
          return (
            <Animated.View
              key={`label-${index}`}
              style={[
                styles.percentageLabel,
                {
                  position: 'absolute',
                  left: x - 25,
                  top: y - 12,
                  opacity: animationValue,
                  transform: [{
                    scale: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  }],
                },
              ]}
            >
              <View style={[styles.percentageBubble, { backgroundColor: segment.color }]}>
                <Text style={styles.percentageText}>
                  {Math.round(segment.percentage * 100)}%
                </Text>
              </View>
            </Animated.View>
          );
        })}
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
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendValue, { color: colors.text }]}>
                  ₩{formatValue(item.value)}
                </Text>
                <Text style={[styles.legendPercentage, { color: colors.textSecondary }]}>
                  ({Math.round((item.value / total) * 100)}%)
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
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
  centerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  percentageLabel: {
    width: 50,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  legend: {
    marginTop: 32,
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
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
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