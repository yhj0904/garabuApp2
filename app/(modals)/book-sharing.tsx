import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { notification } from '@/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Member } from '@/services/api';

interface BookMember {
  member: Member;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

export default function BookSharingScreen() {
  const [bookMembers, setBookMembers] = useState<BookMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, token } = useAuthStore();
  const { currentBook, getBookOwners } = useBookStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 초기 데이터 로드
  useEffect(() => {
    if (token && currentBook) {
      loadBookMembers();
      loadAvailableMembers();
    }
  }, [token, currentBook]);

  const loadBookMembers = async () => {
    if (!token || !currentBook) return;
    
    try {
      setIsLoading(true);
      const owners = await getBookOwners(currentBook.id, token);
      
      // Mock 데이터로 역할 정보 추가
      const mockBookMembers: BookMember[] = owners.map((member, index) => ({
        member,
        role: member.id === currentBook.ownerId ? 'OWNER' : (index % 2 === 0 ? 'EDITOR' : 'VIEWER'),
        joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      setBookMembers(mockBookMembers);
    } catch (error) {
      console.error('Error loading book members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableMembers = async () => {
    if (!token) return;
    
    try {
      const { api } = await import('@/services/api');
      const members = await api.getMembers(token);
      
      // 현재 가계부에 없는 멤버들만 필터링
      const currentMemberIds = bookMembers.map(bm => bm.member.id);
      const available = members.filter(member => !currentMemberIds.includes(member.id));
      
      setAvailableMembers(available);
    } catch (error) {
      console.error('Error loading available members:', error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMember || !token || !currentBook) return;
    
    try {
      setIsLoading(true);
      
      // 실제 API 호출 (현재는 mock)
      console.log('Adding member to book:', {
        bookId: currentBook.id,
        memberId: selectedMember.id,
        role: selectedRole
      });
      
      // Mock 성공 응답
      const newBookMember: BookMember = {
        member: selectedMember,
        role: selectedRole,
        joinedAt: new Date().toISOString()
      };
      
      setBookMembers([...bookMembers, newBookMember]);
      setAvailableMembers(availableMembers.filter(m => m.id !== selectedMember.id));
      
      // 푸시 알림 전송
      await notification.sendBookSharedAlert(
        selectedMember.id.toString(),
        currentBook.title,
        user?.name || user?.username || '사용자'
      );
      
      setShowAddMemberModal(false);
      setSelectedMember(null);
      setSelectedRole('EDITOR');
      
      Alert.alert('성공', '멤버가 가계부에 추가되었습니다.');
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('오류', '멤버 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = (memberId: number) => {
    const member = bookMembers.find(bm => bm.member.id === memberId);
    if (!member) return;
    
    if (member.role === 'OWNER') {
      Alert.alert('오류', '소유자는 제거할 수 없습니다.');
      return;
    }
    
    Alert.alert(
      '멤버 제거',
      `${member.member.name}님을 가계부에서 제거하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // 실제 API 호출 (현재는 mock)
              console.log('Removing member from book:', {
                bookId: currentBook?.id,
                memberId
              });
              
              setBookMembers(bookMembers.filter(bm => bm.member.id !== memberId));
              setAvailableMembers([...availableMembers, member.member]);
              
              Alert.alert('성공', '멤버가 제거되었습니다.');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('오류', '멤버 제거에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleChangeRole = (memberId: number) => {
    const member = bookMembers.find(bm => bm.member.id === memberId);
    if (!member || member.role === 'OWNER') return;
    
    const roleOptions = [
      { label: '편집자', value: 'EDITOR' },
      { label: '조회자', value: 'VIEWER' }
    ];
    
    Alert.alert(
      '역할 변경',
      `${member.member.name}님의 역할을 선택하세요.`,
      [
        { text: '취소', style: 'cancel' },
        ...roleOptions.map(option => ({
          text: option.label,
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // 실제 API 호출 (현재는 mock)
              console.log('Changing member role:', {
                bookId: currentBook?.id,
                memberId,
                newRole: option.value
              });
              
              setBookMembers(bookMembers.map(bm => 
                bm.member.id === memberId 
                  ? { ...bm, role: option.value as 'EDITOR' | 'VIEWER' }
                  : bm
              ));
              
              Alert.alert('성공', '역할이 변경되었습니다.');
            } catch (error) {
              console.error('Error changing role:', error);
              Alert.alert('오류', '역할 변경에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          }
        }))
      ]
    );
  };

  const searchMembers = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Mock 검색 결과
      const mockSearchResult: Member[] = [
        {
          id: Date.now(),
          username: searchEmail.split('@')[0],
          email: searchEmail,
          name: searchEmail.split('@')[0],
          role: 'USER',
          providerId: undefined
        }
      ];
      
      setAvailableMembers(mockSearchResult);
      setSearchEmail('');
      
      Alert.alert('검색 완료', `${mockSearchResult.length}명의 사용자를 찾았습니다.`);
    } catch (error) {
      console.error('Error searching members:', error);
      Alert.alert('오류', '사용자 검색에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'OWNER': return '소유자';
      case 'EDITOR': return '편집자';
      case 'VIEWER': return '조회자';
      default: return '알 수 없음';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return '#4CAF50';
      case 'EDITOR': return '#FF9500';
      case 'VIEWER': return '#8E8E93';
      default: return colors.text;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderMemberItem = ({ item }: { item: BookMember }) => (
    <View style={[styles.memberItem, { backgroundColor: colors.card }]}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person" size={24} color={colors.text} />
        </View>
        <View style={styles.memberDetails}>
          <Text style={[styles.memberName, { color: colors.text }]}>{item.member.name}</Text>
          <Text style={[styles.memberEmail, { color: colors.icon }]}>{item.member.email}</Text>
          <Text style={[styles.memberJoined, { color: colors.icon }]}>
            {formatDate(item.joinedAt)} 참여
          </Text>
        </View>
      </View>
      <View style={styles.memberActions}>
        <View style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.roleText}>{getRoleText(item.role)}</Text>
        </View>
        {item.role !== 'OWNER' && (
          <View style={styles.memberButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleChangeRole(item.member.id)}
            >
              <Ionicons name="settings" size={20} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleRemoveMember(item.member.id)}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderAvailableMember = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={[styles.availableMemberItem, { backgroundColor: colors.card }]}
      onPress={() => setSelectedMember(item)}
    >
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person-add" size={24} color={colors.tint} />
        </View>
        <View style={styles.memberDetails}>
          <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.memberEmail, { color: colors.icon }]}>{item.email}</Text>
        </View>
      </View>
      {selectedMember?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>가계부 공유</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddMemberModal(true)}
        >
          <Ionicons name="person-add" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* 현재 가계부 정보 */}
      {currentBook && (
        <View style={[styles.bookInfo, { backgroundColor: colors.card }]}>
          <Ionicons name="book" size={24} color={colors.tint} />
          <Text style={[styles.bookTitle, { color: colors.text }]}>{currentBook.title}</Text>
          <Text style={[styles.memberCount, { color: colors.icon }]}>
            {bookMembers.length}명 참여
          </Text>
        </View>
      )}

      {/* 멤버 목록 */}
      <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>참여 멤버</Text>
        {bookMembers.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            아직 참여한 멤버가 없습니다.
          </Text>
        ) : (
          <FlatList
            data={bookMembers}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.member.id.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* 멤버 추가 모달 */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>멤버 추가</Text>
            
            {/* 이메일 검색 */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="이메일로 사용자 검색"
                  placeholderTextColor={colors.icon}
                  value={searchEmail}
                  onChangeText={setSearchEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.tint }]}
                  onPress={searchMembers}
                >
                  <Ionicons name="search" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 사용 가능한 멤버 목록 */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>사용자 선택</Text>
            <ScrollView style={styles.availableMemberList}>
              {availableMembers.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  추가할 수 있는 사용자가 없습니다.
                </Text>
              ) : (
                <FlatList
                  data={availableMembers}
                  renderItem={renderAvailableMember}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              )}
            </ScrollView>

            {/* 역할 선택 */}
            {selectedMember && (
              <View style={styles.roleSelection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>역할 선택</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      { backgroundColor: selectedRole === 'EDITOR' ? colors.tint : colors.card }
                    ]}
                    onPress={() => setSelectedRole('EDITOR')}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      { color: selectedRole === 'EDITOR' ? 'white' : colors.text }
                    ]}>편집자</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      { backgroundColor: selectedRole === 'VIEWER' ? colors.tint : colors.card }
                    ]}
                    onPress={() => setSelectedRole('VIEWER')}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      { color: selectedRole === 'VIEWER' ? 'white' : colors.text }
                    ]}>조회자</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 모달 버튼 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.card }]}
                onPress={() => {
                  setShowAddMemberModal(false);
                  setSelectedMember(null);
                  setSelectedRole('EDITOR');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { 
                    backgroundColor: selectedMember ? colors.tint : colors.card,
                    opacity: selectedMember ? 1 : 0.5
                  }
                ]}
                onPress={handleAddMember}
                disabled={!selectedMember || isLoading}
              >
                <Text style={[styles.modalButtonText, { color: selectedMember ? 'white' : colors.text }]}>
                  {isLoading ? '추가 중...' : '추가'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  bookTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
  },
  memberList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  memberJoined: {
    fontSize: 12,
    marginTop: 2,
  },
  memberActions: {
    alignItems: 'flex-end',
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  memberButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableMemberList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  availableMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleSelection: {
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});