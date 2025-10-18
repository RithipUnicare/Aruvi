import { api, ApiResponse } from './apiClient';

export type Category = {
  id: string;
  name: string;
};

export const categoriesService = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
  create: (body: { name: string }) =>
    api.post<ApiResponse<Category>>('/categories', body),
  update: (id: string, body: { name: string }) =>
    api.put<ApiResponse<Category>>(`/categories/${id}`, body),
  remove: (id: string) => api.del<ApiResponse<null>>(`/categories/${id}`),
};
