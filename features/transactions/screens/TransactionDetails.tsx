import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {/* 헤더 추가 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>거래 상세</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.title}>Transaction Details</Text>
            <Text style={styles.subtitle}>Transaction ID: {id}</Text>
          
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transaction Information</Text>
              <Text style={styles.placeholder}>
                This is a placeholder screen for transaction details.
                Add amount, date, category, and description here.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category & Tags</Text>
              <Text style={styles.placeholder}>Transaction category and tags will appear here</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              <Text style={styles.placeholder}>Receipts and other attachments will appear here</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>History</Text>
              <Text style={styles.placeholder}>Transaction edit history will appear here</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Transaction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
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
  actions: {
    marginTop: 24,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});