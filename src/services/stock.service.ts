import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const stockService = {
  getStockMovements: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK_MOVEMENTS.GET_ALL, {
      params: { page, limit }
    });
    return response.data;
  },

  createStockMovement: async (data: { 
    productId: string; 
    movementType: string; 
    quantity: number; 
    referenceType?: string; 
    referenceId?: string; 
  }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.STOCK_MOVEMENTS.CREATE, data);
    return response.data.data;
  }
};
