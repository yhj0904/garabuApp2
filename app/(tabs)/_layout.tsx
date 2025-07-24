import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useScreenTracking } from '@/hooks/useScreenTracking';

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();
  useScreenTracking();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.tabBarBorder,
            height: Platform.OS === 'ios' ? 100 : 70,
            paddingBottom: Platform.OS === 'ios' ? 34 : 10,
            paddingTop: 8,
            paddingHorizontal: 10,
          },
        ],
        tabBarLabelStyle: [
          styles.tabBarLabel,
          {
            color: colors.tabBarInactive,
            fontWeight: '500',
          },
        ],
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
      }}
      initialRouteName="index">
      <Tabs.Screen
        name="index"
        options={{
          title: '가계부',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "notebook" : "notebook-outline"} 
              size={size ?? 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "stats-chart" : "stats-chart-outline"} 
              size={size ?? 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="asset"
        options={{
          title: '자산',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome 
              name="credit-card" 
              size={size ?? 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '더보기',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "ellipsis-horizontal-circle" : "ellipsis-horizontal-circle-outline"} 
              size={size ?? 24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarIcon: {
    marginTop: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
}); 