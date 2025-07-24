import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';
import { useAuthStore } from '@/stores/authStore';

interface PurchaseData {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  purchaseType: 'subscription' | 'one_time' | 'in_app_purchase';
  platform: 'ios' | 'android';
}

interface TransactionValue {
  amount: number;
  currency: string;
  category: string;
  paymentMethod?: string;
}

export const useRevenueTracking = () => {
  const { logEvent } = useAnalytics();
  const { user } = useAuthStore();

  // 구매 추적
  const trackPurchase = useCallback((purchaseData: PurchaseData) => {
    logEvent('purchase', {
      value: purchaseData.price,
      currency: purchaseData.currency,
      transaction_id: `${Date.now()}_${purchaseData.productId}`,
      items: [{
        item_id: purchaseData.productId,
        item_name: purchaseData.productName,
        price: purchaseData.price,
        quantity: 1
      }],
      purchase_type: purchaseData.purchaseType,
      platform: purchaseData.platform,
      user_id: user?.userId
    });

    // 수익 관련 사용자 속성 업데이트
    if (purchaseData.purchaseType === 'subscription') {
      logEvent('subscription_started', {
        product_id: purchaseData.productId,
        price: purchaseData.price,
        currency: purchaseData.currency
      });
    }
  }, [logEvent, user]);

  // 구독 취소 추적
  const trackSubscriptionCanceled = useCallback((productId: string, reason?: string) => {
    logEvent('subscription_canceled', {
      product_id: productId,
      cancellation_reason: reason,
      user_id: user?.userId
    });
  }, [logEvent, user]);

  // 거래 가치 추적 (가계부 거래의 총 가치)
  const trackTransactionValue = useCallback((transaction: TransactionValue) => {
    // 지출만 추적 (수입은 제외)
    if (transaction.amount < 0) return;

    logEvent('transaction_value', {
      value: transaction.amount,
      currency: transaction.currency,
      category: transaction.category,
      payment_method: transaction.paymentMethod,
      user_id: user?.userId
    });

    // 고액 거래 별도 추적 (100만원 이상)
    if (transaction.amount >= 1000000) {
      logEvent('high_value_transaction', {
        value: transaction.amount,
        currency: transaction.currency,
        category: transaction.category
      });
    }
  }, [logEvent, user]);

  // 월별 지출 총액 추적
  const trackMonthlySpending = useCallback((totalAmount: number, currency: string, month: string) => {
    logEvent('monthly_spending_total', {
      value: totalAmount,
      currency: currency,
      month: month,
      user_id: user?.userId
    });

    // 지출 수준별 사용자 분류
    let spendingLevel = 'low';
    if (totalAmount > 5000000) {
      spendingLevel = 'very_high';
    } else if (totalAmount > 3000000) {
      spendingLevel = 'high';
    } else if (totalAmount > 1000000) {
      spendingLevel = 'medium';
    }

    logEvent('spending_level_classified', {
      level: spendingLevel,
      month: month
    });
  }, [logEvent, user]);

  // 예산 대비 지출 추적
  const trackBudgetVsActual = useCallback((budgetAmount: number, actualAmount: number, currency: string) => {
    const percentageUsed = (actualAmount / budgetAmount) * 100;
    
    logEvent('budget_usage', {
      budget_amount: budgetAmount,
      actual_amount: actualAmount,
      percentage_used: Math.round(percentageUsed),
      currency: currency,
      over_budget: actualAmount > budgetAmount
    });

    // 예산 초과 알림
    if (actualAmount > budgetAmount) {
      logEvent('budget_exceeded', {
        exceeded_by: actualAmount - budgetAmount,
        percentage_over: Math.round(((actualAmount - budgetAmount) / budgetAmount) * 100)
      });
    }
  }, [logEvent]);

  return {
    trackPurchase,
    trackSubscriptionCanceled,
    trackTransactionValue,
    trackMonthlySpending,
    trackBudgetVsActual
  };
};