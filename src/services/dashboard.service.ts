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

  getRecentRepairs: async (limit = 5) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.RECENT_REPAIRS}?limit=${limit}`);
    return response.data.data;
  },

  getRecentSales: async (limit = 5) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.RECENT_SALES}?limit=${limit}`);
    return response.data.data;
  },

  getLowStock: async (limit = 5) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD.LOW_STOCK}?limit=${limit}`);
    return response.data.data;
  },

  getTechnicianWorkload: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.TECHNICIAN_WORKLOAD);
    return response.data.data;
  },
};
