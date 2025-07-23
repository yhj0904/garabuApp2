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
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores/authStore';
import { useBookStore } from '../../stores/bookStore';
import apiService from '../../services/api';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

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
  '#36A2EB', '#FF9FF3', '#54A0FF', '#48DBFB', '#00D2D3',
  '#FF9500', '#FF2D92', '#5856D6', '#34C759', '#007AFF'
];

const getTagIcon = (tagName: string) => {
  const name = tagName.toLowerCase();
  if (name.includes('식') || name.includes('음식') || name.includes('카페')) return 'restaurant';
  if (name.includes('교통') || name.includes('택시') || name.includes('버스')) return 'car';
  if (name.includes('쇼핑') || name.includes('구매')) return 'bag';
  if (name.includes('의료') || name.includes('병원')) return 'medical';
  if (name.includes('교육') || name.includes('학습')) return 'school';
  if (name.includes('여행') || name.includes('휴가')) return 'airplane';
  if (name.includes('운동') || name.includes('헬스')) return 'fitness';
  if (name.includes('문화') || name.includes('영화')) return 'film';
  return 'pricetag';
};

export default function TagsScreen() {
  const authStore = useAuthStore();
  const bookStore = useBookStore();
  const { colors, isDarkMode } = useTheme();
  
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

      const tags = await apiService.getTagsByBook(currentBook.id);
      setTags(tags || []);
    } catch (error: any) {
      console.error('태그 목록 조회 실패:', error);
      // 404 에러는 태그가 없는 경우이므로 정상적인 상황
      if (error.response?.status === 404) {
        setTags([]);
      } else {
        Alert.alert('오류', '태그 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('오류', '태그 이름을 입력해주세요.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      const data = {
        bookId: currentBook.id,
        name: name.trim(),
        color: selectedColor,
      };

      if (editingTag) {
        await apiService.updateTag(editingTag.id, {
          name: data.name,
          color: data.color,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('성공', '태그가 수정되었습니다.');
      } else {
        await apiService.createTag(currentBook.id, {
          name: data.name,
          color: data.color,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('성공', '태그가 생성되었습니다.');
      }

      resetForm();
      setModalVisible(false);
      fetchTags();
    } catch (error: any) {
      console.error('태그 저장 실패:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.response?.status === 400) {
        Alert.alert('오류', '이미 존재하는 태그 이름입니다.');
      } else {
        Alert.alert('오류', '태그 저장에 실패했습니다.');
      }
    }
  };

  const handleDelete = async (id: number, usageCount: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (usageCount > 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
        { 
          text: '취소', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTag(id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('성공', '태그가 삭제되었습니다.');
              fetchTags();
            } catch (error) {
              console.error('태그 삭제 실패:', error);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('오류', '태그 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = async (tag: Tag) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      style={[styles.tagCard, { backgroundColor: colors.card }]}
      onPress={() => handleEdit(item)}
      onLongPress={() => handleDelete(item.id, item.usageCount)}
      activeOpacity={0.7}
    >
      <View style={styles.tagHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons 
            name={getTagIcon(item.name) as any} 
            size={20} 
            color={item.color} 
          />
        </View>
        <View style={styles.tagContent}>
          <Text style={[styles.tagName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.usageCount, { color: colors.textSecondary }]}>
            {item.usageCount > 0 ? `${item.usageCount}개 거래에서 사용 중` : '사용되지 않음'}
          </Text>
        </View>
      </View>
      <View style={styles.tagActions}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>태그 관리</Text>
        <TouchableOpacity 
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          style={styles.headerAddButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.innerContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="태그 검색"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredTags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTag ? '태그 수정' : '새 태그'}
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>태그 이름</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="예: 식비, 교통비, 쇼핑"
                placeholderTextColor={colors.textTertiary}
                maxLength={20}
              />

              <Text style={[styles.label, { color: colors.text }]}>색상 선택</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor,
                    ]}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedColor(color);
                    }}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color={isDarkMode ? colors.text : 'white'} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.previewContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>미리보기</Text>
                <View style={[styles.previewTag, { backgroundColor: colors.card }]}>
                  <View style={[styles.previewIconContainer, { backgroundColor: selectedColor + '20' }]}>
                    <Ionicons 
                      name={getTagIcon(name || '태그') as any} 
                      size={18} 
                      color={selectedColor} 
                    />
                  </View>
                  <Text style={[styles.previewText, { color: colors.text }]}>{name || '태그 이름'}</Text>
                  <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => {
                    resetForm();
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  innerContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAddButton: {
    padding: 4,
    borderRadius: 8,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1C1C1E',
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
    color: '#8E8E93',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tagCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tagContent: {
    flex: 1,
  },
  tagName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  tagActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  usageCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 20,
    color: '#1C1C1E',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#1C1C1E',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#007AFF',
    transform: [{ scale: 1.1 }],
  },
  previewContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 12,
    fontWeight: '500',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  previewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 