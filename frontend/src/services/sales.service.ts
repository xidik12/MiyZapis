import { apiClient } from './api';

// ---------------------------------------------------------------------------
// Sales suite client: gift cards, service packages, memberships.
// NOTE: "selling" = the owner ISSUES/assigns (records) the product. Live card
// payments aren't enabled yet; redemption (gift-card balance / package credits)
// is the only real value movement.
// ---------------------------------------------------------------------------

export const GIFT_CARD_STATUSES = ['ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'] as const;
export type GiftCardStatus = typeof GIFT_CARD_STATUSES[number];

export const GIFT_CARD_REASONS = ['ISSUE', 'REDEEM', 'REFUND', 'ADJUST'] as const;
export type GiftCardReason = typeof GIFT_CARD_REASONS[number];

export const PACKAGE_STATUSES = ['ACTIVE', 'USED', 'EXPIRED'] as const;
export type PackageStatus = typeof PACKAGE_STATUSES[number];

export const MEMBERSHIP_STATUSES = ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE'] as const;
export type MembershipStatus = typeof MEMBERSHIP_STATUSES[number];

export const BILLING_PERIODS = ['MONTHLY', 'YEARLY'] as const;
export type BillingPeriod = typeof BILLING_PERIODS[number];

// ---- Types ----------------------------------------------------------------

export interface GiftCard {
  id: string;
  ownerId: string;
  businessId?: string | null;
  code: string;
  initialAmount: number | string;
  balance: number | string;
  currency: string;
  status: GiftCardStatus;
  recipientEmail?: string | null;
  recipientUserId?: string | null;
  purchasedByUserId?: string | null;
  note?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  amount: number | string;
  reason: GiftCardReason;
  bookingId?: string | null;
  createdAt: string;
}

export interface ServicePackage {
  id: string;
  ownerId: string;
  businessId?: string | null;
  name: string;
  description?: string | null;
  serviceId?: string | null;
  credits: number;
  price: number | string;
  currency: string;
  validDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { purchases: number };
}

export interface CustomerPackage {
  id: string;
  packageId: string;
  customerUserId: string;
  remainingCredits: number;
  status: PackageStatus;
  purchasedAt: string;
  expiresAt?: string | null;
  package?: ServicePackage;
}

export interface MembershipPlan {
  id: string;
  ownerId: string;
  businessId?: string | null;
  name: string;
  description?: string | null;
  price: number | string;
  currency: string;
  billingPeriod: BillingPeriod;
  benefits?: string | null;
  discountPercent: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
}

export interface CustomerMembership {
  id: string;
  planId: string;
  customerUserId: string;
  status: MembershipStatus;
  startedAt: string;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  plan?: MembershipPlan;
}

export interface SalesSummary {
  activeGiftCards: number;
  giftCardOutstanding: number;
  packagesSold: number;
  creditsOutstanding: number;
  activeMembers: number;
  mrrEstimate: number;
  currency: string;
}

export interface GiftCardCodeLookup {
  id: string;
  code: string;
  balance: number;
  currency: string;
  status: GiftCardStatus;
  expiresAt?: string | null;
}

// ---- Request DTOs ---------------------------------------------------------

export interface IssueGiftCardData {
  initialAmount: number;
  currency?: string;
  recipientEmail?: string;
  note?: string;
  expiresAt?: string | null;
}

export interface CreatePackageData {
  name: string;
  description?: string;
  serviceId?: string;
  credits: number;
  price: number;
  currency?: string;
  validDays?: number;
  isActive?: boolean;
}

export interface CreatePlanData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingPeriod?: BillingPeriod;
  benefits?: string;
  discountPercent?: number;
  isActive?: boolean;
}

export interface GrantTarget {
  customerUserId?: string;
  customerEmail?: string;
}

export class SalesService {
  // ---- Summary ----
  async getSummary(): Promise<SalesSummary> {
    const response = await apiClient.get<SalesSummary>('/sales/summary');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get sales summary');
    }
    return response.data;
  }

  // ---- Gift cards ----
  async getGiftCards(filters: { status?: GiftCardStatus; search?: string } = {}): Promise<GiftCard[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, value.toString());
    });
    const response = await apiClient.get<{ giftCards: GiftCard[] }>(`/sales/gift-cards?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get gift cards');
    }
    return response.data.giftCards;
  }

  async issueGiftCard(data: IssueGiftCardData): Promise<GiftCard> {
    const response = await apiClient.post<GiftCard>('/sales/gift-cards', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to issue gift card');
    }
    return response.data;
  }

  async getGiftCardByCode(code: string): Promise<GiftCardCodeLookup> {
    const response = await apiClient.get<GiftCardCodeLookup>(`/sales/gift-cards/code/${encodeURIComponent(code)}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Gift card not found');
    }
    return response.data;
  }

  async redeemGiftCard(
    id: string,
    amount: number,
    bookingId?: string
  ): Promise<{ card: GiftCard; transaction: GiftCardTransaction }> {
    const response = await apiClient.post<{ card: GiftCard; transaction: GiftCardTransaction }>(
      `/sales/gift-cards/${id}/redeem`,
      { amount, bookingId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to redeem gift card');
    }
    return response.data;
  }

  async cancelGiftCard(id: string): Promise<GiftCard> {
    const response = await apiClient.post<GiftCard>(`/sales/gift-cards/${id}/cancel`, {});
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to cancel gift card');
    }
    return response.data;
  }

  // ---- Packages ----
  async getPackages(): Promise<ServicePackage[]> {
    const response = await apiClient.get<{ packages: ServicePackage[] }>('/sales/packages');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get packages');
    }
    return response.data.packages;
  }

  async createPackage(data: CreatePackageData): Promise<ServicePackage> {
    const response = await apiClient.post<ServicePackage>('/sales/packages', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create package');
    }
    return response.data;
  }

  async updatePackage(id: string, data: Partial<CreatePackageData>): Promise<ServicePackage> {
    const response = await apiClient.put<ServicePackage>(`/sales/packages/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update package');
    }
    return response.data;
  }

  async deletePackage(id: string): Promise<void> {
    const response = await apiClient.delete(`/sales/packages/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete package');
    }
  }

  async grantPackage(packageId: string, target: GrantTarget): Promise<CustomerPackage> {
    const response = await apiClient.post<CustomerPackage>(`/sales/packages/${packageId}/grant`, target);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to grant package');
    }
    return response.data;
  }

  async getCustomerPackages(filters: { customerUserId?: string } = {}): Promise<CustomerPackage[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, value.toString());
    });
    const response = await apiClient.get<{ customerPackages: CustomerPackage[] }>(`/sales/customer-packages?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get customer packages');
    }
    return response.data.customerPackages;
  }

  async usePackageCredit(customerPackageId: string, bookingId?: string): Promise<CustomerPackage> {
    const response = await apiClient.post<CustomerPackage>(
      `/sales/customer-packages/${customerPackageId}/use`,
      { bookingId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to use package credit');
    }
    return response.data;
  }

  // ---- Memberships ----
  async getPlans(): Promise<MembershipPlan[]> {
    const response = await apiClient.get<{ plans: MembershipPlan[] }>('/sales/plans');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get plans');
    }
    return response.data.plans;
  }

  async createPlan(data: CreatePlanData): Promise<MembershipPlan> {
    const response = await apiClient.post<MembershipPlan>('/sales/plans', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create plan');
    }
    return response.data;
  }

  async updatePlan(id: string, data: Partial<CreatePlanData>): Promise<MembershipPlan> {
    const response = await apiClient.put<MembershipPlan>(`/sales/plans/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update plan');
    }
    return response.data;
  }

  async deletePlan(id: string): Promise<void> {
    const response = await apiClient.delete(`/sales/plans/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete plan');
    }
  }

  async enrollMember(planId: string, target: GrantTarget): Promise<CustomerMembership> {
    const response = await apiClient.post<CustomerMembership>(`/sales/plans/${planId}/enroll`, target);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to enroll member');
    }
    return response.data;
  }

  async getMembers(filters: { planId?: string } = {}): Promise<CustomerMembership[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, value.toString());
    });
    const response = await apiClient.get<{ members: CustomerMembership[] }>(`/sales/members?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get members');
    }
    return response.data.members;
  }

  async cancelMembership(id: string): Promise<CustomerMembership> {
    const response = await apiClient.post<CustomerMembership>(`/sales/members/${id}/cancel`, {});
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to cancel membership');
    }
    return response.data;
  }
}

export const salesService = new SalesService();
