import { api, ApiResponse } from './apiClient';

export type WaiterIssue = {
  id: string;
  date: number;
  description: string;
};

export type Waiter = {
  id: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  joinDate: number;
  status: 'active' | 'inactive';
  ordersCompleted: number;
  issues: WaiterIssue[];
};

export const waitersService = {
  getAll: () => api.get<ApiResponse<Waiter[]>>('/waiters'),
  getById: (id: string) => api.get<ApiResponse<Waiter>>(`/waiters/${id}`),
  create: (body: {
    username: string;
    password: string;
    name: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive';
  }) => api.post<ApiResponse<Waiter>>('/waiters', body),
  update: (
    id: string,
    body: {
      username: string;
      password: string;
      name: string;
      phone: string;
      email: string;
      status: 'active' | 'inactive';
    }
  ) => api.put<ApiResponse<Waiter>>(`/waiters/${id}`, body),
  remove: (id: string) => api.del<ApiResponse<null>>(`/waiters/${id}`),
  addIssue: (id: string, body: { description: string }) =>
    api.post<ApiResponse<WaiterIssue>>(`/waiters/${id}/issues`, body),
  stats: (id: string, date: string) =>
    api.get<ApiResponse<{
      waiterId: string;
      date: string;
      ordersCompleted: number;
      totalRevenue: number;
      averageOrderValue: number;
    }>>(`/waiters/${id}/stats?date=${encodeURIComponent(date)}`),
  getCredentials: (id: string) =>
    api.get<ApiResponse<{ username: string; password: string }>>(
      `/waiters/${id}/credentials`
    ),
  updateCredentials: (id: string, body: { username: string; password: string }) =>
    api.put<ApiResponse<{ username: string; password: string }>>(
      `/waiters/${id}/credentials`,
      body
    ),
};
