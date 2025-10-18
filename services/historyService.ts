import { api, ApiResponse } from './apiClient';
import type { Bill } from './billsService';

export const historyService = {
  getAll: () => api.get<ApiResponse<Bill[]>>('/history'),
  getByDate: (date: string) =>
    api.get<ApiResponse<Bill[]>>(`/history?date=${encodeURIComponent(date)}`),
  getById: (id: string) => api.get<ApiResponse<Bill>>(`/history/${id}`),
};
