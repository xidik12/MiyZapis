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

export class WalletService {
  // Get wallet balance
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<WalletBalance>('/payments/wallet/balance');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get wallet balance');
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

