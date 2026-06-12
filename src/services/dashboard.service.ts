import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const dashboardService = {
  getSummary: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = params.toString() ? `${API_ENDPOINTS.DASHBOARD.SUMMARY}?${params.toString()}` : API_ENDPOINTS.DASHBOARD.SUMMARY;
    const response = await axiosInstance.get(url);
    return response.data.data;
  },

  getRecentRepairs: async (limit = 5, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.RECENT_REPAIRS}?${params.toString()}`);
    return response.data.data;
  },

  getRecentSales: async (limit = 5, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.RECENT_SALES}?${params.toString()}`);
    return response.data.data;
  },

  getLowStock: async (limit = 5) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.LOW_STOCK}?limit=${limit}`);
    return response.data.data;
  },

  getTechnicianWorkload: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = params.toString() ? `${API_ENDPOINTS.DASHBOARD.TECHNICIAN_WORKLOAD}?${params.toString()}` : API_ENDPOINTS.DASHBOARD.TECHNICIAN_WORKLOAD;
    const response = await axiosInstance.get(url);
    return response.data.data;
  },

  getWeeklyPerformance: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = params.toString() ? `${API_ENDPOINTS.DASHBOARD.WEEKLY_PERFORMANCE}?${params.toString()}` : API_ENDPOINTS.DASHBOARD.WEEKLY_PERFORMANCE;
    const response = await axiosInstance.get(url);
    return response.data.data;
  },

  getTopProducts: async (limit = 5, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.TOP_PRODUCTS}?${params.toString()}`);
    return response.data.data;
  },
};
