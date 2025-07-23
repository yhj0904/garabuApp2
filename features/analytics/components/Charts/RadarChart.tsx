import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface RadarChartProps {
  data: {
    label: string;
    value: number;
    maxValue: number;
  }[];
  size?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  fillOpacity?: number;
}

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export default function RadarChart({ 
  data, 
  size = 250,
  showGrid = true,
  showLabels = true,
  fillOpacity = 0.3
}: RadarChartProps) {
  const { colors } = useTheme();
  const animationValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [data]);
  
  if (!data || data.length < 3) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          최소 3개의 데이터가 필요합니다
        </Text>
      </View>
    );
  }

  const center = size / 2;
  const radius = size * 0.35;
  const angleStep = (2 * Math.PI) / data.length;
  
  // 각 점의 좌표 계산
  const getCoordinates = (value: number, maxValue: number, index: number) => {
    const ratio = value / maxValue;
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * ratio * Math.cos(angle);
    const y = center + radius * ratio * Math.sin(angle);
    return { x, y };
  };
  
  // 그리드 라인 좌표 계산
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridPolygons = gridLevels.map(level => {
    const points = data.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * level * Math.cos(angle);
      const y = center + radius * level * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    return points;
  });
  
  // 데이터 포인트 계산
  const dataPoints = data.map((item, index) => 
    getCoordinates(item.value, item.maxValue, index)
  );
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // 라벨 위치 계산
  const labelPositions = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 30;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    
    // 텍스트 정렬 조정
    let textAnchor = 'middle';
    if (Math.abs(x - center) > 10) {
      textAnchor = x > center ? 'start' : 'end';
    }
    
    return { x, y, textAnchor, label: item.label };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {/* 그리드 */}
          {showGrid && (
            <>
              {/* 그리드 폴리곤 */}
              {gridPolygons.map((points, index) => (
                <Polygon
                  key={index}
                  points={points}
                  fill="none"
                  stroke={colors.border}
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}
              
              {/* 축 라인 */}
              {data.map((_, index) => {
                const angle = index * angleStep - Math.PI / 2;
                const x2 = center + radius * Math.cos(angle);
                const y2 = center + radius * Math.sin(angle);
                return (
                  <Line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke={colors.border}
                    strokeWidth="1"
                    opacity="0.3"
                  />
                );
              })}
            </>
          )}
          
          {/* 데이터 영역 */}
          <AnimatedPolygon
            points={dataPolygon}
            fill={colors.primary}
            fillOpacity={fillOpacity}
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinejoin="round"
            opacity={animationValue}
          />
          
          {/* 데이터 포인트 */}
          {dataPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={colors.background}
              stroke={colors.primary}
              strokeWidth="2"
            />
          ))}
          
          {/* 라벨 */}
          {showLabels && labelPositions.map((pos, index) => (
            <SvgText
              key={index}
              x={pos.x}
              y={pos.y}
              fill={colors.text}
              fontSize="12"
              fontWeight="500"
              textAnchor={pos.textAnchor}
              alignmentBaseline="middle"
            >
              {pos.label}
            </SvgText>
          ))}
          
          {/* 그리드 레벨 텍스트 */}
          {showGrid && gridLevels.map((level, index) => (
            <SvgText
              key={index}
              x={center + 5}
              y={center - radius * level}
              fill={colors.textSecondary}
              fontSize="10"
              textAnchor="start"
            >
              {(level * 100).toFixed(0)}%
            </SvgText>
          ))}
        </G>
      </Svg>
      
      {/* 값 표시 */}
      <View style={styles.valuesContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.valueItem}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
              {item.label}:
            </Text>
            <Text style={[styles.valueText, { color: colors.text }]}>
              {((item.value / item.maxValue) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
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
    textAlign: 'center',
  },
  valuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
    justifyContent: 'center',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueLabel: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
  },
});