import { api, ApiResponse } from './apiClient';

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
};

export const productsService = {
  getAll: () => api.get<ApiResponse<Product[]>>('/products'),
  getById: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),
  create: (body: { name: string; price: number; categoryId: string }) =>
    api.post<ApiResponse<Product>>('/products', body),
  update: (
    id: string,
    body: { name: string; price: number; categoryId: string }
  ) => api.put<ApiResponse<Product>>(`/products/${id}`, body),
  remove: (id: string) => api.del<ApiResponse<null>>(`/products/${id}`),
};
