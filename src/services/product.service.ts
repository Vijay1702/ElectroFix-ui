import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const productService = {
  getProducts: async (page = 1, limit = 10, search = "", categoryId = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.GET_ALL, {
      params: { page, limit, search, categoryId }
    });
    return response.data;
  },

  getLowStock: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.LOW_STOCK);
    return response.data.data;
  },

  createProduct: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PRODUCTS.CREATE, data);
    return response.data.data;
  },

  updateProduct: async (id: string, data: any) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.PRODUCTS.UPDATE}/${id}`, data);
    return response.data.data;
  },

  deleteProduct: async (id: string) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.PRODUCTS.DELETE}/${id}`);
    return response.data.data;
  }
};
