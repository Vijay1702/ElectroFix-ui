import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const customerService = {
  getCustomers: async (page = 1, limit = 10, search = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.CUSTOMERS.GET_ALL, {
      params: { page, limit, search }
    });
    return response.data; // expecting { data: [...], total, page, limit } based on backend
  },

  getCustomerById: async (id: string) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.CUSTOMERS.GET_BY_ID}/${id}`);
    return response.data.data;
  },

  getCustomerHistory: async (id: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.CUSTOMERS.HISTORY.replace(':id', id));
    return response.data.data;
  },

  createCustomer: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return response.data.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.CUSTOMERS.UPDATE}/${id}`, data);
    return response.data.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.CUSTOMERS.DELETE}/${id}`);
    return response.data.data;
  }
};
