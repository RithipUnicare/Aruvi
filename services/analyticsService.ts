import { api, ApiResponse } from './apiClient';

export const analyticsService = {
  sales: (date: string) =>
    api.get<ApiResponse<{ date: string; totalRevenue: number; totalOrders: number; totalItems: number; averageOrderValue: number }>>(
      `/analytics/sales?date=${encodeURIComponent(date)}`
    ),
  topProducts: (date: string, limit = 10) =>
    api.get<ApiResponse<Array<{ productId: string; productName: string; quantitySold: number; revenue: number; percentage: number }>>>(
      `/analytics/products/top?date=${encodeURIComponent(date)}&limit=${limit}`
    ),
  nonSellingProducts: (date: string) =>
    api.get<ApiResponse<Array<{ productId: string; productName: string; categoryId: string; categoryName: string; lastSold: number }>>>(
      `/analytics/products/non-selling?date=${encodeURIComponent(date)}`
    ),
  categories: (date: string) =>
    api.get<ApiResponse<Array<{ categoryId: string; categoryName: string; revenue: number; percentage: number; itemsSold: number }>>>(
      `/analytics/categories?date=${encodeURIComponent(date)}`
    ),
};
