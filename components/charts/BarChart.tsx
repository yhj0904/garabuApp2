import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
  showGrid?: boolean;
  barColor?: string;
  maxValue?: number;
}

export default function BarChart({ 
  data, 
  height = 200, 
  showValues = true,
  showGrid = true,
  barColor = '#007AFF',
  maxValue
}: BarChartProps) {
  const chartHeight = height - 40; // Space for labels
  const maxDataValue = maxValue || Math.max(...data.map(item => item.value));
  
  if (maxDataValue === 0 || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>데이터가 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chart}>
          {/* Grid lines */}
          {showGrid && (
            <View style={[styles.gridContainer, { height: chartHeight }]}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <View
                  key={index}
                  style={[
                    styles.gridLine,
                    { bottom: ratio * chartHeight }
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Y-axis labels */}
          <View style={[styles.yAxisLabels, { height: chartHeight }]}>
            {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
              <Text
                key={index}
                style={[
                  styles.yAxisLabel,
                  { bottom: ratio * chartHeight - 6 }
                ]}
              >
                {(maxDataValue * ratio / 1000).toFixed(0)}k
              </Text>
            ))}
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.map((item, index) => {
              const barHeight = (item.value / maxDataValue) * chartHeight;
              const itemBarColor = item.color || barColor;
              
              return (
                <View key={index} style={styles.barColumn}>
                  <View style={[styles.barContainer, { height: chartHeight }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: itemBarColor,
                        }
                      ]}
                    />
                    {showValues && item.value > 0 && (
                      <Text style={[styles.barValue, { bottom: barHeight + 4 }]}>
                        {item.value >= 1000 
                          ? `${(item.value / 1000).toFixed(0)}k`
                          : item.value.toString()
                        }
                      </Text>
                    )}
                  </View>
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    minWidth: '100%',
  },
  chart: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    left: 40,
    right: 0,
    bottom: 30,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    width: 35,
    bottom: 30,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'right',
    width: 30,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 40,
    marginBottom: 30,
    flex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    minWidth: 40,
    marginHorizontal: 2,
  },
  barContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 1,
  },
  barValue: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
  },
  barLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    numberOfLines: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});