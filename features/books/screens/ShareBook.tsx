import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Member } from '@/core/api/client';

interface BookMemberWithJoinDate {
  member: Member;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

export default function BookSharingScreen() {
  const [bookMembersWithJoinDate, setBookMembersWithJoinDate] = useState<BookMemberWithJoinDate[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, token } = useAuthStore();
  const { 
    currentBook, 
    bookMembers, 
    fetchBookMembers, 
    inviteUser, 
    removeMember, 
    changeRole, 
    leaveBook 
  } = useBookStore();
  const router = useRouter();
  const { colors } = useTheme();

  // 초기 데이터 로드
  useEffect(() => {
    if (token && currentBook) {
      loadBookMembers();
      loadAvailableMembers();
    }
  }, [token, currentBook]);

  // bookMembers 상태 변경 시 화면 업데이트
  useEffect(() => {
    if (bookMembers.length > 0) {
      const membersWithJoinDate: BookMemberWithJoinDate[] = bookMembers.map(member => ({
        member: {
          id: member.memberId,
          username: member.username,
          email: member.email,
          name: member.username,
          role: 'USER'
        },
        role: member.role,
        joinedAt: member.joinedAt
      }));
      
      setBookMembersWithJoinDate(membersWithJoinDate);
    }
  }, [bookMembers]);

  const loadBookMembers = async () => {
    if (!token || !currentBook) return;
    
    try {
      setIsLoading(true);
      const success = await fetchBookMembers(currentBook.id, token);
      
      if (success && bookMembers.length > 0) {
        // bookMembers를 BookMemberWithJoinDate로 변환
        const membersWithJoinDate: BookMemberWithJoinDate[] = bookMembers.map(member => ({
          member: {
            id: member.memberId,
            username: member.username,
            email: member.email,
            name: member.username,
            role: 'USER'
          },
          role: member.role,
          joinedAt: member.joinedAt
        }));
        
        setBookMembersWithJoinDate(membersWithJoinDate);
      } else {
        // 데이터 로딩 실패 시 빈 배열 설정
        setBookMembersWithJoinDate([]);
        console.warn('Book members data is empty or loading failed');
      }
    } catch (error) {
      console.error('Error loading book members:', error);
      setBookMembersWithJoinDate([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableMembers = async () => {
    if (!token) return;
    
    try {
      // TODO: 실제 API 구현 필요 - 사용 가능한 멤버 목록 조회
      // const apiService = (await import('@/services/api')).default;
      // const allMembers = await apiService.getMembers(token);
      
      // 현재는 빈 배열 반환
      setAvailableMembers([]);
    } catch (error) {
      console.error('Error loading available members:', error);
    }
  };

  const handleAddMember = async () => {
    // 이메일 초대 방식은 초대 코드 방식과 충돌하므로 제거
    Alert.alert('알림', '멤버 추가는 초대 코드를 통해서만 가능합니다.\n가계부 설정에서 초대 코드를 생성해주세요.');
    setShowAddMemberModal(false);
  };

  const handleRemoveMember = (memberId: number) => {
    const member = bookMembersWithJoinDate.find(bm => bm.member.id === memberId);
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
              
              const success = await removeMember(currentBook?.id || 0, memberId, token || '');
              
              if (success) {
                // 성공 시 멤버 목록 새로고침
                await loadBookMembers();
                setAvailableMembers([...availableMembers, member.member]);
                
                Alert.alert('성공', '멤버가 제거되었습니다.');
              } else {
                Alert.alert('오류', '멤버 제거에 실패했습니다.');
              }
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
    const member = bookMembersWithJoinDate.find(bm => bm.member.id === memberId);
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
              
              const success = await changeRole(
                currentBook?.id || 0, 
                memberId, 
                { role: option.value as 'EDITOR' | 'VIEWER' }, 
                token || ''
              );
              
              if (success) {
                // 성공 시 멤버 목록 새로고침
                await loadBookMembers();
                Alert.alert('성공', '역할이 변경되었습니다.');
              } else {
                Alert.alert('오류', '역할 변경에 실패했습니다.');
              }
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
      
      // TODO: 실제 API 구현 필요 - 이메일로 사용자 검색
      Alert.alert('알림', '사용자 검색 기능은 아직 구현되지 않았습니다.');
      setSearchEmail('');
      setAvailableMembers([]);
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

  const renderMemberItem = ({ item }: { item: BookMemberWithJoinDate }) => (
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>가계부 공유</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            router.push({
              pathname: '/(modals)/book-settings',
              params: { bookId: currentBook?.id.toString(), bookTitle: currentBook?.title, userRole: bookMembers.find(m => m.memberId === user?.id)?.role || 'VIEWER' }
            });
          }}
        >
          <Ionicons name="settings" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* 현재 가계부 정보 */}
      {currentBook && (
        <View style={[styles.bookInfo, { backgroundColor: colors.card }]}>
          <Ionicons name="book" size={24} color={colors.tint} />
          <Text style={[styles.bookTitle, { color: colors.text }]}>{currentBook.title}</Text>
          <Text style={[styles.memberCount, { color: colors.icon }]}>
            {bookMembersWithJoinDate.length}명 참여
          </Text>
        </View>
      )}

      {/* 멤버 목록 */}
      <View style={styles.memberList}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>참여 멤버</Text>
        {isLoading ? (
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            로딩 중...
          </Text>
        ) : bookMembersWithJoinDate.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            아직 참여한 멤버가 없습니다.
          </Text>
        ) : (
          <FlatList
            data={bookMembersWithJoinDate}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.member.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

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
            <View style={styles.availableMemberList}>
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
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>

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
    </View>
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