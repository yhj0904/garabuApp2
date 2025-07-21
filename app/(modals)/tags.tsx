import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useBookStore } from '../../stores/bookStore';
import axios from 'axios';
import config from '../../config/config';

interface Tag {
  id: number;
  name: string;
  color: string;
  usageCount: number;
  createdAt: string;
  updatedAt?: string;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FD79A8', '#A29BFE', '#74B9FF', '#55A3FF', '#FD6384',
  '#36A2EB', '#FF9FF3', '#54A0FF', '#48DBFB', '#00D2D3'
];

export default function TagsScreen() {
  const authStore = useAuthStore();
  const bookStore = useBookStore();
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      const response = await axios.get(
        `${config.API_BASE_URL}/api/v2/tags/book/${currentBook.id}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );
      setTags(response.data);
    } catch (error) {
      console.error('태그 목록 조회 실패:', error);
      Alert.alert('오류', '태그 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '태그 이름을 입력해주세요.');
      return;
    }

    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      const data = {
        bookId: currentBook.id,
        name: name.trim(),
        color: selectedColor,
      };

      if (editingTag) {
        await axios.put(
          `${config.API_BASE_URL}/api/v2/tags/${editingTag.id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        Alert.alert('성공', '태그가 수정되었습니다.');
      } else {
        await axios.post(
          `${config.API_BASE_URL}/api/v2/tags`,
          data,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        Alert.alert('성공', '태그가 생성되었습니다.');
      }

      resetForm();
      setModalVisible(false);
      fetchTags();
    } catch (error: any) {
      console.error('태그 저장 실패:', error);
      if (error.response?.status === 400) {
        Alert.alert('오류', '이미 존재하는 태그 이름입니다.');
      } else {
        Alert.alert('오류', '태그 저장에 실패했습니다.');
      }
    }
  };

  const handleDelete = async (id: number, usageCount: number) => {
    if (usageCount > 0) {
      Alert.alert(
        '삭제 불가',
        `이 태그는 ${usageCount}개의 거래에서 사용 중입니다. 먼저 해당 거래에서 태그를 제거해주세요.`
      );
      return;
    }

    Alert.alert(
      '삭제 확인',
      '이 태그를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${config.API_BASE_URL}/api/v2/tags/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${authStore.token}`,
                  },
                }
              );
              Alert.alert('성공', '태그가 삭제되었습니다.');
              fetchTags();
            } catch (error) {
              console.error('태그 삭제 실패:', error);
              Alert.alert('오류', '태그 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setSelectedColor(tag.color);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingTag(null);
    setName('');
    setSelectedColor(COLORS[0]);
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTag = ({ item }: { item: Tag }) => (
    <TouchableOpacity
      style={styles.tagCard}
      onPress={() => handleEdit(item)}
      onLongPress={() => handleDelete(item.id, item.usageCount)}
    >
      <View style={styles.tagHeader}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text style={styles.tagName}>{item.name}</Text>
      </View>
      <View style={styles.tagInfo}>
        <Text style={styles.usageCount}>
          {item.usageCount}개 거래에서 사용 중
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '태그 관리',
          headerRight: () => (
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="태그 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredTags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다' : '등록된 태그가 없습니다'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTags}
            renderItem={renderTag}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            resetForm();
            setModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingTag ? '태그 수정' : '새 태그'}
              </Text>

              <Text style={styles.label}>태그 이름</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="예: 식비, 교통비, 쇼핑"
                maxLength={20}
              />

              <Text style={styles.label}>색상 선택</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>미리보기</Text>
                <View style={styles.previewTag}>
                  <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
                  <Text style={styles.previewText}>{name || '태그 이름'}</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    resetForm();
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tagCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  previewContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 