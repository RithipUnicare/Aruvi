import { api, ApiResponse } from './apiClient';

export type Hotel = {
  id: string;
  shopName: string;
  shopAddress: string;
  shopDescription: string;
  noOfTables: number;
};

export const hotelsService = {
  getAll: () => api.get<ApiResponse<Hotel[]>>('/hotels'),
  getById: (id: string) => api.get<ApiResponse<Hotel>>(`/hotels/${id}`),
  create: (body: Omit<Hotel, 'id'>) => api.post<ApiResponse<Hotel>>('/hotels', body),
  update: (id: string, body: Omit<Hotel, 'id'>) =>
    api.put<ApiResponse<Hotel>>(`/hotels/${id}`, body),
  remove: (id: string) => api.del<ApiResponse<null>>(`/hotels/${id}`),
};
