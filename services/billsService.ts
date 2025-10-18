import { api, ApiResponse } from './apiClient';

export type BillItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type Bill = {
  id: string;
  kudilId: string;
  waiterId: string;
  items: BillItem[];
  total: number;
  timestamp: number;
};

export const billsService = {
  print: (body: {
    kudilId: string;
    waiterId: string;
    items: BillItem[];
    total: number;
  }) => api.post<ApiResponse<Bill>>('/bills/print', body),
};
