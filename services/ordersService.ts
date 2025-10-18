import { api, ApiResponse } from './apiClient';

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type KudilOrder = {
  kudilId: string;
  items: OrderItem[];
  total?: number;
  itemCount?: number;
};

export const ordersService = {
  getAll: () => api.get<ApiResponse<KudilOrder[]>>('/orders'),
  getByKudil: (kudilId: string) =>
    api.get<ApiResponse<KudilOrder>>(`/orders/${kudilId}`),
  addItem: (kudilId: string, item: OrderItem) =>
    api.post<ApiResponse<KudilOrder>>(`/orders/${kudilId}/items`, item),
  updateItem: (kudilId: string, productId: string, body: { quantity: number }) =>
    api.put<ApiResponse<{ kudilId: string; productId: string; quantity: number }>>(
      `/orders/${kudilId}/items/${productId}`,
      body
    ),
  removeItem: (kudilId: string, productId: string) =>
    api.del<ApiResponse<null>>(`/orders/${kudilId}/items/${productId}`),
  clear: (kudilId: string) => api.del<ApiResponse<null>>(`/orders/${kudilId}`),
  complete: (kudilId: string) =>
    api.post<ApiResponse<{ kudilId: string; completed: boolean; timestamp: number }>>(
      `/orders/${kudilId}/complete`,
      { completed: true }
    ),
};
