import { apiClient } from './api';

// ---------------------------------------------------------------------------
// Retail storefront / online ordering client.
//
// Customers browse a specialist's RETAIL products and place orders online;
// orders are collected / paid in-store (no live card payment yet) and are
// fulfilment-tracked. Stock is deducted on the owner side at FULFILLED.
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const FULFILMENT_TYPES = ['PICKUP', 'DELIVERY'] as const;
export type FulfilmentType = typeof FULFILMENT_TYPES[number];

// ---- Types ----------------------------------------------------------------

export interface StorefrontProduct {
  id: string;
  name: string;
  description?: string | null;
  salePrice: number;
  currency: string;
  stockQty: number;
  unit?: string;
  image?: string | null;
}

export interface ProductOrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  quantity: number | string;
  unitPrice: number | string;
}

export interface ProductOrder {
  id: string;
  ownerId: string;
  businessId?: string | null;
  customerUserId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  orderNumber: string;
  status: OrderStatus;
  fulfilment: FulfilmentType;
  currency: string;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  paymentMethod?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ProductOrderItem[];
  _count?: { items: number };
}

export interface TodaySummary {
  date: string;
  count: number;
  gross: number;
  byMethod: Record<string, number>;
  refundedTotal: number;
  currency: string;
}

export interface GiftCardLookup {
  id: string;
  code: string;
  balance: number;
  currency: string;
  status: string;
  expiresAt?: string | null;
}

export interface StoreSummary {
  pendingOrders: number;
  monthSalesTotal: number;
  currency: string;
}

// ---- Request DTOs ---------------------------------------------------------

export interface PlaceOrderItem {
  productId: string;
  quantity: number;
}

export interface PlaceOrderData {
  sellerUserId: string;
  customerName?: string;
  customerEmail?: string;
  fulfilment?: FulfilmentType;
  note?: string;
  items: PlaceOrderItem[];
}

export class StoreService {
  // ---- Public storefront ----
  async getStorefront(sellerUserId: string, businessId?: string): Promise<StorefrontProduct[]> {
    const params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    const qs = params.toString();
    const response = await apiClient.get<{ products: StorefrontProduct[] }>(
      `/store/${encodeURIComponent(sellerUserId)}/products${qs ? `?${qs}` : ''}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load storefront');
    }
    return response.data.products;
  }

  async placeOrder(data: PlaceOrderData): Promise<ProductOrder> {
    const response = await apiClient.post<ProductOrder>('/store/orders', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to place order');
    }
    return response.data;
  }

  // ---- POS: look up a gift card by code (owner-scoped) ----
  async lookupGiftCard(code: string): Promise<GiftCardLookup> {
    const response = await apiClient.get<GiftCardLookup>(
      `/store/pos/giftcard/${encodeURIComponent(code.trim())}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Gift card not found');
    }
    return response.data;
  }

  // ---- POS: instant in-person counter sale ----
  async posSale(data: {
    items: { productId: string; quantity: number }[];
    paymentMethod?: 'CASH' | 'CARD' | 'OTHER';
    customerName?: string;
    note?: string;
    discount?: number;
    giftCardCode?: string;
  }): Promise<ProductOrder> {
    const response = await apiClient.post<ProductOrder>('/store/pos/sale', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to record sale');
    }
    return response.data;
  }

  // ---- POS: refund an order (restocks items) ----
  async refundOrder(orderId: string): Promise<ProductOrder> {
    const response = await apiClient.post<ProductOrder>(`/store/pos/orders/${encodeURIComponent(orderId)}/refund`, {});
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to refund order');
    }
    return response.data;
  }

  // ---- POS: end-of-day summary ----
  async todaySummary(): Promise<TodaySummary> {
    const response = await apiClient.get<TodaySummary>('/store/pos/today');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get today summary');
    }
    return response.data;
  }

  // ---- Owner order management ----
  async getSummary(): Promise<StoreSummary> {
    const response = await apiClient.get<StoreSummary>('/store/orders/summary');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get store summary');
    }
    return response.data;
  }

  async listOrders(filters: { status?: OrderStatus } = {}): Promise<ProductOrder[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    const qs = params.toString();
    const response = await apiClient.get<{ orders: ProductOrder[] }>(
      `/store/orders${qs ? `?${qs}` : ''}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get orders');
    }
    return response.data.orders;
  }

  async getOrder(id: string): Promise<ProductOrder> {
    const response = await apiClient.get<ProductOrder>(`/store/orders/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Order not found');
    }
    return response.data;
  }

  async setOrderStatus(id: string, status: OrderStatus): Promise<ProductOrder> {
    const response = await apiClient.post<ProductOrder>(`/store/orders/${id}/status`, { status });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update order status');
    }
    return response.data;
  }
}

export const storeService = new StoreService();
