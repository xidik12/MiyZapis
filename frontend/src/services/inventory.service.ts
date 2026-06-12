import { apiClient } from './api';

// Product types
export const PRODUCT_TYPES = ['CONSUMABLE', 'RETAIL'] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

// Stock movement reasons
export const STOCK_REASONS = ['PURCHASE', 'USAGE', 'SALE', 'ADJUSTMENT', 'RETURN'] as const;
export type StockReason = typeof STOCK_REASONS[number];

export interface Product {
  id: string;
  ownerId: string;
  businessId?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  type: ProductType;
  unit: string;
  costPrice: number | string;
  salePrice?: number | string | null;
  stockQty: number | string;
  reorderLevel: number | string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  delta: number | string;
  reason: StockReason;
  reference?: string | null;
  createdById: string;
  createdAt: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  currency: string;
}

export interface InventoryFilters {
  type?: ProductType;
  lowStock?: boolean;
  search?: string;
}

export interface CreateProductData {
  sku?: string;
  name: string;
  description?: string;
  type?: ProductType;
  unit?: string;
  costPrice?: number;
  salePrice?: number | null;
  stockQty?: number;
  reorderLevel?: number;
  currency?: string;
}

export interface UpdateProductData {
  sku?: string;
  name?: string;
  description?: string;
  type?: ProductType;
  unit?: string;
  costPrice?: number;
  salePrice?: number | null;
  reorderLevel?: number;
  currency?: string;
  isActive?: boolean;
}

export interface AdjustStockData {
  delta: number;
  reason: StockReason;
  reference?: string;
}

// A product a service consumes per booking (joined with product name/unit/stock).
export interface ServiceConsumable {
  id: string;
  serviceId: string;
  productId: string;
  quantity: number;
  productName: string;
  unit: string;
  stockQty: number;
}

// Row sent when replacing a service's consumable mapping.
export interface ServiceConsumableInput {
  productId: string;
  quantity: number;
}

export class InventoryService {
  // List products with optional filters
  async getProducts(filters: InventoryFilters = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{ products: Product[] }>(`/inventory?${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get products');
    }

    return response.data.products;
  }

  // Get inventory summary
  async getSummary(): Promise<InventorySummary> {
    const response = await apiClient.get<InventorySummary>('/inventory/summary');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get inventory summary');
    }

    return response.data;
  }

  // Get single product by ID
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/inventory/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get product');
    }

    return response.data;
  }

  // Create product
  async createProduct(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post<Product>('/inventory', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create product');
    }

    return response.data;
  }

  // Update product
  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    const response = await apiClient.put<Product>(`/inventory/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update product');
    }

    return response.data;
  }

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const response = await apiClient.delete(`/inventory/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete product');
    }
  }

  // Adjust stock (creates a movement + updates qty)
  async adjustStock(id: string, data: AdjustStockData): Promise<{ movement: StockMovement; product: Product }> {
    const response = await apiClient.post<{ movement: StockMovement; product: Product }>(
      `/inventory/${id}/adjust`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to adjust stock');
    }

    return response.data;
  }

  // Get movement history for a product
  async getMovements(id: string): Promise<StockMovement[]> {
    const response = await apiClient.get<{ movements: StockMovement[] }>(`/inventory/${id}/movements`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get movements');
    }

    return response.data.movements;
  }

  // Get the consumable mapping for a service (what stock each booking consumes)
  async getServiceConsumables(serviceId: string): Promise<ServiceConsumable[]> {
    const response = await apiClient.get<{ consumables: ServiceConsumable[] }>(
      `/inventory/services/${serviceId}/consumables`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service consumables');
    }

    return response.data.consumables;
  }

  // Replace the consumable mapping for a service
  async setServiceConsumables(
    serviceId: string,
    items: ServiceConsumableInput[]
  ): Promise<ServiceConsumable[]> {
    const response = await apiClient.put<{ consumables: ServiceConsumable[] }>(
      `/inventory/services/${serviceId}/consumables`,
      { items }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to save service consumables');
    }

    return response.data.consumables;
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
