import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface PieChartData {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  data: PieChartData[];
  radius?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  centerText?: string;
  centerSubtext?: string;
}

export default function PieChart({ 
  data, 
  radius = 80, 
  strokeWidth = 20, 
  showLabels = true,
  centerText,
  centerSubtext
}: PieChartProps) {
  const { colors } = useTheme();
  const center = radius + strokeWidth;
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  if (totalValue === 0) {
    return (
      <View style={[styles.container, { width: center * 2, height: center * 2 }]}>
        <Svg width={center * 2} height={center * 2}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.border}
            strokeWidth={strokeWidth}
          />
        </Svg>
        <View style={styles.centerContent}>
          <Text style={[styles.centerText, { color: colors.textTertiary }]}>데이터 없음</Text>
        </View>
      </View>
    );
  }

  let cumulativePercentage = 0;
  const arcs = data.map((item, index) => {
    const percentage = (item.value / totalValue) * 100;
    const startAngle = cumulativePercentage * 3.6; // Convert to degrees
    const endAngle = (cumulativePercentage + percentage) * 3.6;
    
    cumulativePercentage += percentage;
    
    const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
    const endAngleRad = ((endAngle - 90) * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return {
      pathData,
      color: item.color,
      percentage,
      label: item.label,
      value: item.value
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { width: center * 2, height: center * 2 }]}>
        <Svg width={center * 2} height={center * 2}>
          {arcs.map((arc, index) => (
            <Path
              key={index}
              d={arc.pathData}
              fill={arc.color}
              stroke={colors.background}
              strokeWidth={2}
            />
          ))}
        </Svg>
        
        {/* Center content */}
        <View style={styles.centerContent}>
          {centerText && (
            <Text style={[styles.centerText, { color: colors.text }]}>{centerText}</Text>
          )}
          {centerSubtext && (
            <Text style={[styles.centerSubtext, { color: colors.textSecondary }]}>{centerSubtext}</Text>
          )}
        </View>
      </View>

      {/* Legend */}
      {showLabels && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]}>
                {item.label} ({((item.value / totalValue) * 100).toFixed(1)}%)
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                ₩{item.value.toLocaleString()}
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
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  legend: {
    marginTop: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendColor: {
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
    fontWeight: '500',
  },
});