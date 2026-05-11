import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const dashboardService = {
  getSummary: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.SUMMARY);
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
