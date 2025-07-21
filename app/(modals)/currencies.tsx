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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useBookStore } from '../../stores/bookStore';
import axios from 'axios';
import config from '../../config/config';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  isDefault: boolean;
  exchangeRates?: ExchangeRate[];
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
  currencyId: number;
  isDefault: boolean;
}

const POPULAR_CURRENCIES = [
  { code: 'USD', name: '미국 달러', symbol: '$' },
  { code: 'EUR', name: '유로', symbol: '€' },
  { code: 'JPY', name: '일본 엔', symbol: '¥' },
  { code: 'CNY', name: '중국 위안', symbol: '¥' },
  { code: 'GBP', name: '영국 파운드', symbol: '£' },
];

export default function CurrenciesScreen() {
  const authStore = useAuthStore();
  const bookStore = useBookStore();
  
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [bookCurrencies, setBookCurrencies] = useState<BookCurrency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      // 모든 통화 목록 조회
      const currenciesResponse = await axios.get(
        `${config.API_BASE_URL}/api/v2/currencies`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      // 가계부의 통화 설정 조회
      const bookCurrenciesResponse = await axios.get(
        `${config.API_BASE_URL}/api/v2/currencies/book/${currentBook.id}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      // 환율 정보 조회
      const ratesResponse = await axios.get(
        `${config.API_BASE_URL}/api/v2/currencies/exchange-rates?from=KRW`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      setCurrencies(currenciesResponse.data);
      setBookCurrencies(bookCurrenciesResponse.data);
      setExchangeRates(ratesResponse.data);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrency = async (currency: Currency) => {
    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      const isEnabled = bookCurrencies.some(
        (bc) => bc.currencyId === currency.id
      );

      if (isEnabled) {
        // 통화 비활성화
        if (bookCurrencies.find(bc => bc.currencyId === currency.id)?.isDefault) {
          Alert.alert('오류', '기본 통화는 비활성화할 수 없습니다.');
          return;
        }

        await axios.delete(
          `${config.API_BASE_URL}/api/v2/currencies/book/${currentBook.id}/currency/${currency.id}`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
      } else {
        // 통화 활성화
        await axios.post(
          `${config.API_BASE_URL}/api/v2/currencies/book/${currentBook.id}/currency`,
          { currencyId: currency.id },
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
      }

      fetchData();
    } catch (error) {
      console.error('통화 설정 변경 실패:', error);
      Alert.alert('오류', '통화 설정 변경에 실패했습니다.');
    }
  };

  const setDefaultCurrency = async (currency: Currency) => {
    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      await axios.put(
        `${config.API_BASE_URL}/api/v2/currencies/book/${currentBook.id}/default`,
        { currencyId: currency.id },
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      Alert.alert('성공', `${currency.name}이(가) 기본 통화로 설정되었습니다.`);
      fetchData();
    } catch (error) {
      console.error('기본 통화 설정 실패:', error);
      Alert.alert('오류', '기본 통화 설정에 실패했습니다.');
    }
  };

  const addCustomCurrency = () => {
    Alert.prompt(
      '사용자 정의 통화',
      '통화 코드를 입력하세요 (예: BTC)',
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
              await axios.post(
                `${config.API_BASE_URL}/api/v2/currencies`,
                {
                  code: code.toUpperCase(),
                  name: code.toUpperCase(),
                  symbol: code.toUpperCase(),
                },
                {
                  headers: {
                    Authorization: `Bearer ${authStore.token}`,
                  },
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
    
    if (!showAll && !isActive && !POPULAR_CURRENCIES.some(pc => pc.code === currency.code)) {
      return false;
    }
    
    return (
      currency.code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower)
    );
  });

  const renderCurrency = ({ item }: { item: Currency }) => {
    const bookCurrency = bookCurrencies.find((bc) => bc.currencyId === item.id);
    const isEnabled = !!bookCurrency;
    const isDefault = bookCurrency?.isDefault || false;
    const exchangeRate = exchangeRates.find((rate) => rate.toCurrency === item.code);

    return (
      <View style={styles.currencyCard}>
        <View style={styles.currencyInfo}>
          <View style={styles.currencyHeader}>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencySymbol}>{item.symbol}</Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>기본</Text>
              </View>
            )}
          </View>
          <Text style={styles.currencyName}>{item.name}</Text>
          {exchangeRate && (
            <Text style={styles.exchangeRate}>
              1 KRW = {exchangeRate.rate.toFixed(4)} {item.code}
            </Text>
          )}
        </View>
        
        <View style={styles.actions}>
          {isEnabled && !isDefault && (
            <TouchableOpacity
              style={styles.defaultButton}
              onPress={() => setDefaultCurrency(item)}
            >
              <Text style={styles.defaultButtonText}>기본 설정</Text>
            </TouchableOpacity>
          )}
          <Switch
            value={isEnabled}
            onValueChange={() => toggleCurrency(item)}
            disabled={isDefault}
          />
        </View>
      </View>
    );
  };

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
          title: '통화 관리',
          headerRight: () => (
            <TouchableOpacity onPress={addCustomCurrency}>
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
            placeholder="통화 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>모든 통화 표시</Text>
          <Switch value={showAll} onValueChange={setShowAll} />
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
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
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  currencyCard: {
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
    fontWeight: '700',
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  exchangeRate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  defaultButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  defaultButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
}); 