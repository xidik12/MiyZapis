// Wallet service - adapted for React Native
import { apiClient } from './api';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND';
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  description?: string;
  referenceId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface WalletTransactionHistory {
  transactions: WalletTransaction[];
  total: number;
  balance: number;
}

export interface WalletSummary {
  balance: number;
  pendingBalance: number;
  totalCredits: number;
  totalDebits: number;
  totalEarned: number;
  totalSpent: number;
  totalWithdrawn?: number;
  currency: string;
}

export class WalletService {
  // Get wallet balance
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<WalletBalance>('/payments/wallet/balance');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get wallet balance');
    }
    return response.data;
  }

  // Get wallet summary
  async getWalletSummary(): Promise<WalletSummary> {
    const response = await apiClient.get<WalletSummary>('/payments/wallet/summary');
    if (!response.success || !response.data) {
      // Fallback: calculate from balance and transaction history
      const balance = await this.getBalance();
      const history = await this.getTransactionHistory({ limit: 100 });
      
      const totalCredits = history.transactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDebits = history.transactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        balance: balance.balance,
        pendingBalance: history.transactions
          .filter(t => t.status === 'PENDING')
          .reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0),
        totalCredits,
        totalDebits,
        totalEarned: totalCredits,
        totalSpent: totalDebits,
        currency: balance.currency,
      };
    }
    return response.data;
  }

  // Get transaction history
  async getTransactionHistory(filters: {
    limit?: number;
    offset?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<WalletTransactionHistory> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<WalletTransactionHistory>(
      `/payments/wallet/transactions?${params}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get transaction history');
    }
    return response.data;
  }

  // Apply wallet to booking
  async applyWalletToBooking(bookingId: string, maxAmount?: number): Promise<{
    appliedAmount: number;
    remainingBalance: number;
    transaction?: WalletTransaction;
  }> {
    const response = await apiClient.post(`/payments/bookings/${bookingId}/wallet`, {
      maxAmount,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to apply wallet to booking');
    }
    return response.data;
  }

  // Add funds to wallet
  async addFunds(amount: number, paymentMethodId: string): Promise<{
    transaction: WalletTransaction;
    paymentIntent?: any;
  }> {
    const response = await apiClient.post('/payments/wallet/add-funds', {
      amount,
      paymentMethodId,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add funds');
    }
    return response.data;
  }
}

export const walletService = new WalletService();

