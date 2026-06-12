import { apiClient } from './api';

// Purchase order statuses
export const PO_STATUSES = ['DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const;
export type POStatus = typeof PO_STATUSES[number];

export interface Supplier {
  id: string;
  ownerId: string;
  businessId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string | null;
  description: string;
  quantity: number | string;
  unitCost: number | string;
  receivedQty: number | string;
}

export interface PurchaseOrder {
  id: string;
  ownerId: string;
  businessId?: string | null;
  supplierId?: string | null;
  poNumber: string;
  status: POStatus;
  currency: string;
  subtotal: number | string;
  taxAmount: number | string;
  total: number | string;
  notes?: string | null;
  orderedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // From list endpoint:
  supplierName?: string | null;
  itemCount?: number;
  // From detail endpoint:
  supplier?: Supplier | null;
  items?: PurchaseOrderItem[];
}

export interface PurchasingSummary {
  countsByStatus: Record<string, number>;
  totalOutstanding: number;
  totalSpentThisMonth: number;
  currency: string;
}

export interface SupplierData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface POItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePOData {
  supplierId?: string | null;
  currency?: string;
  notes?: string | null;
  taxAmount?: number;
  items: POItemInput[];
}

export interface UpdatePOData {
  supplierId?: string | null;
  currency?: string;
  notes?: string | null;
  taxAmount?: number;
  items?: POItemInput[];
}

export interface POFilters {
  status?: POStatus;
  supplierId?: string;
}

export interface ReceiptInput {
  itemId: string;
  receivedQty: number;
}

export class PurchasingService {
  // ---------- Suppliers ----------

  async getSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get<{ suppliers: Supplier[] }>('/purchasing/suppliers');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get suppliers');
    }
    return response.data.suppliers;
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const response = await apiClient.get<Supplier>(`/purchasing/suppliers/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get supplier');
    }
    return response.data;
  }

  async createSupplier(data: SupplierData): Promise<Supplier> {
    const response = await apiClient.post<Supplier>('/purchasing/suppliers', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create supplier');
    }
    return response.data;
  }

  async updateSupplier(id: string, data: Partial<SupplierData>): Promise<Supplier> {
    const response = await apiClient.put<Supplier>(`/purchasing/suppliers/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update supplier');
    }
    return response.data;
  }

  async deleteSupplier(id: string): Promise<void> {
    const response = await apiClient.delete(`/purchasing/suppliers/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete supplier');
    }
  }

  // ---------- Purchase orders ----------

  async getSummary(): Promise<PurchasingSummary> {
    const response = await apiClient.get<PurchasingSummary>('/purchasing/orders/summary');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get purchasing summary');
    }
    return response.data;
  }

  async getOrders(filters: POFilters = {}): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{ orders: PurchaseOrder[] }>(`/purchasing/orders?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get purchase orders');
    }
    return response.data.orders;
  }

  async getOrderById(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get<PurchaseOrder>(`/purchasing/orders/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get purchase order');
    }
    return response.data;
  }

  async createOrder(data: CreatePOData): Promise<PurchaseOrder> {
    const response = await apiClient.post<PurchaseOrder>('/purchasing/orders', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create purchase order');
    }
    return response.data;
  }

  async updateOrder(id: string, data: UpdatePOData): Promise<PurchaseOrder> {
    const response = await apiClient.put<PurchaseOrder>(`/purchasing/orders/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update purchase order');
    }
    return response.data;
  }

  async deleteOrder(id: string): Promise<void> {
    const response = await apiClient.delete(`/purchasing/orders/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete purchase order');
    }
  }

  async setStatus(id: string, status: POStatus): Promise<PurchaseOrder> {
    const response = await apiClient.post<PurchaseOrder>(`/purchasing/orders/${id}/status`, { status });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update status');
    }
    return response.data;
  }

  // Receive a PO. Omit `receipts` to fully receive; otherwise pass per-item cumulative targets.
  async receiveOrder(id: string, receipts?: ReceiptInput[]): Promise<PurchaseOrder> {
    const response = await apiClient.post<PurchaseOrder>(
      `/purchasing/orders/${id}/receive`,
      receipts ? { receipts } : {}
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to receive purchase order');
    }
    return response.data;
  }
}

// Export singleton instance
export const purchasingService = new PurchasingService();
