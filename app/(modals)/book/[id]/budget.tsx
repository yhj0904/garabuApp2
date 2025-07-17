import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BudgetDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Budget Details',
          presentation: 'modal',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Budget Details</Text>
          <Text style={styles.subtitle}>Book ID: {id}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            <Text style={styles.placeholder}>
              This is a placeholder screen for budget details.
              Add budget breakdown, spending limits, and tracking here.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Budgets</Text>
            <Text style={styles.placeholder}>Category-wise budget allocation will appear here</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget vs Actual</Text>
            <Text style={styles.placeholder}>Budget comparison and analysis will appear here</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget History</Text>
            <Text style={styles.placeholder}>Historical budget data will appear here</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
});