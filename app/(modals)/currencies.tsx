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
  Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useBookStore } from '../../stores/bookStore';
import apiService from '../../services/api';
import { useTheme } from '@/contexts/ThemeContext';

interface Currency {
  id: number;
  currencyCode: string;
  currencyName: string;
  currencyNameKr?: string;
  symbol: string;
  decimalPlaces?: number;
  isActive?: boolean;
  code?: string; // for backward compatibility
  name?: string; // for backward compatibility
}

interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

interface BookCurrency {
  bookId: number;
  defaultCurrency: string;
  useMultiCurrency: boolean;
}

const POPULAR_CURRENCIES = [
  { code: 'USD', name: '미국 달러', symbol: '$' },
  { code: 'EUR', name: '유로', symbol: '€' },
  { code: 'JPY', name: '일본 엔', symbol: '¥' },
  { code: 'CNY', name: '중국 위안', symbol: '¥' },
  { code: 'GBP', name: '영국 파운드', symbol: '£' },
];

export default function CurrenciesScreen() {
  const { token } = useAuthStore();
  const { currentBook } = useBookStore();
  const { colors } = useTheme();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [bookCurrencies, setBookCurrencies] = useState<BookCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!token || !currentBook) return;
    
    try {
      setLoading(true);
      
      // 모든 통화 조회
      const currenciesResponse = await apiService.axiosInstance.get('/currencies');
      setCurrencies(currenciesResponse.data);
      
      // 현재 가계부의 활성 통화 조회
      const bookCurrencyResponse = await apiService.axiosInstance.get(`/currencies/books/${currentBook.id}/currency`);
      setBookCurrencies([bookCurrencyResponse.data]); // 단일 객체를 배열로 감싸기
      
    } catch (error) {
      console.error('통화 데이터 로드 실패:', error);
      Alert.alert('오류', '통화 데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrency = async (currency: Currency) => {
    if (!token || !currentBook) return;
    
    const isActive = bookCurrencies.some(bc => bc.defaultCurrency === (currency.currencyCode || currency.code));
    
    try {
      // 가계부 기본 통화 설정으로 통합
      await apiService.axiosInstance.put(`/currencies/books/${currentBook.id}/currency`, {
        currencyCode: currency.currencyCode || currency.code,
        useMultiCurrency: true
      });
      
      fetchData(); // 데이터 새로고침
    } catch (error) {
      console.error('통화 설정 실패:', error);
      Alert.alert('오류', '통화 설정에 실패했습니다.');
    }
  };

  const renderCurrency = ({ item }: { item: Currency }) => {
    const isActive = bookCurrencies.some(bc => bc.defaultCurrency === (item.currencyCode || item.code));
    const isDefault = isActive; // 현재 API에서는 defaultCurrency만 설정됨
    
    const code = item.currencyCode || item.code || '';
    const name = item.currencyName || item.name || '';
    const nameKr = item.currencyNameKr || '';
    
    return (
      <TouchableOpacity
        style={[styles.currencyItem, { backgroundColor: colors.card }, isActive && { backgroundColor: colors.background, borderColor: colors.primary }]}
        onPress={() => toggleCurrency(item)}
      >
        <View style={styles.currencyInfo}>
          <View style={styles.currencyHeader}>
            <Text style={[styles.currencyCode, { color: colors.text }]}>{code}</Text>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>{item.symbol}</Text>
            {isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.defaultText}>기본</Text>
              </View>
            )}
          </View>
          <Text style={[styles.currencyName, { color: colors.textSecondary }]}>{nameKr || name}</Text>
        </View>
        <View style={[styles.checkbox, { borderColor: colors.border }, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {isActive && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  const addCustomCurrency = () => {
    Alert.prompt(
      '통화 추가',
      '통화 코드를 입력하세요 (예: USD, EUR)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '추가',
          onPress: async (code) => {
            if (!code || code.length !== 3) {
              Alert.alert('오류', '통화 코드는 3자리여야 합니다.');
              return;
            }

            try {
              await apiService.axiosInstance.post(
                `/currencies`,
                {
                  code: code.toUpperCase(),
                  name: code.toUpperCase(),
                  symbol: code.toUpperCase(),
                }
              );

              Alert.alert('성공', '통화가 추가되었습니다.');
              fetchData();
            } catch (error: any) {
              if (error.response?.status === 400) {
                Alert.alert('오류', '이미 존재하는 통화 코드입니다.');
              } else {
                Alert.alert('오류', '통화 추가에 실패했습니다.');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const filteredCurrencies = currencies.filter((currency) => {
    const searchLower = searchQuery.toLowerCase();
    const isActive = bookCurrencies.some((bc) => bc.currencyId === currency.id);
    
    const code = currency.currencyCode || currency.code || '';
    const name = currency.currencyName || currency.name || '';
    const nameKr = currency.currencyNameKr || '';
    
    if (!showAll && !isActive && !POPULAR_CURRENCIES.some(pc => pc.code === code)) {
      return false;
    }
    
    return (
      code.toLowerCase().includes(searchLower) ||
      name.toLowerCase().includes(searchLower) ||
      nameKr.toLowerCase().includes(searchLower)
    );
  });

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>통화 관리</Text>
        <TouchableOpacity onPress={addCustomCurrency} style={styles.headerAddButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.innerContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="통화 검색"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>모든 통화 표시</Text>
          <Switch value={showAll} onValueChange={setShowAll} />
        </View>

        <View style={[styles.infoContainer, { backgroundColor: colors.info + '20' }]}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.info }]}>
            여러 통화를 활성화하여 다중 통화로 거래를 기록할 수 있습니다.
          </Text>
        </View>

        <FlatList
          data={filteredCurrencies}
          renderItem={renderCurrency}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerAddButton: {
    padding: 8,
    borderRadius: 8,
  },
  innerContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  filterLabel: {
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  activeCurrency: {
    borderWidth: 1,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: 8,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
  },
});