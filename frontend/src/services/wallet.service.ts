import { apiClient } from './api';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'FORFEITURE_SPLIT';
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  processedAt?: string;
  booking?: {
    id: string;
    scheduledAt: string;
    service: {
      name: string;
    };
  };
}

export interface WalletTransactionHistory {
  transactions: WalletTransaction[];
  total: number;
  balance: number;
}

export interface WalletSummary {
  balance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
  pendingTransactions: number;
  lastTransactionAt?: string;
}

export interface TransactionFilters {
  limit?: number;
  offset?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export class WalletService {
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<WalletBalance>('/payments/wallet/balance');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get wallet balance');
    }

    return response.data;
  }

  async getTransactionHistory(filters: TransactionFilters = {}): Promise<WalletTransactionHistory> {
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

  async getWalletSummary(): Promise<WalletSummary> {
    // This endpoint might not exist yet, so we'll construct it from balance and transactions
    try {
      const [balance, _transactions] = await Promise.all([
        this.getBalance(),
        this.getTransactionHistory({ limit: 1 })
      ]);

      // Calculate totals from transaction history
      const allTransactions = await this.getTransactionHistory({ limit: 1000 });

      const credits = allTransactions.transactions
        .filter(t => ['CREDIT', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const debits = allTransactions.transactions
        .filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const pending = allTransactions.transactions.filter(t => t.status === 'PENDING').length;

      const lastTransaction = allTransactions.transactions[0];

      return {
        balance: balance.balance,
        currency: balance.currency,
        totalCredits: credits,
        totalDebits: debits,
        pendingTransactions: pending,
        lastTransactionAt: lastTransaction?.createdAt,
      };
    } catch (error) {
      console.warn('Failed to get comprehensive wallet summary, falling back to balance only:', error);
      const balance = await this.getBalance();
      return {
        balance: balance.balance,
        currency: balance.currency,
        totalCredits: 0,
        totalDebits: 0,
        pendingTransactions: 0,
      };
    }
  }

  formatTransactionReason(reason: string): string {
    const reasonLabels: Record<string, string> = {
      DEPOSIT_REFUND: 'Deposit Refund',
      CANCELLATION_CREDIT: 'Cancellation Credit',
      BOOKING_PAYMENT: 'Booking Payment',
      DEPOSIT_FORFEITURE_SPLIT: 'Forfeiture Share',
      USER_TRANSFER: 'Transfer',
    };
    return reasonLabels[reason] || reason.replace(/_/g, ' ').toLowerCase();
  }

}

export const walletService = new WalletService();