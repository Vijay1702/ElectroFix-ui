import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const expenseService = {
  getExpenses: async (page = 1, limit = 5, search = "", startDate = "", endDate = "") => {
    const params: any = { page, limit, search };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosInstance.get(API_ENDPOINTS.EXPENSES.GET_ALL, { params });
    return response.data;
  },

  getExpenseById: async (id: string) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.EXPENSES.GET_BY_ID}/${id}`);
    return response.data;
  },

  createExpense: async (data: {
    expenseName: string;
    amount: number;
    description?: string;
    expenseDate?: string;
  }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.EXPENSES.CREATE, data);
    return response.data;
  },

  updateExpense: async (id: string, data: any) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.EXPENSES.UPDATE}/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.EXPENSES.DELETE}/${id}`);
    return response.data;
  },

  getExpensesByDateRange: async (startDate: string, endDate: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.EXPENSES.BY_DATE_RANGE, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getTotalExpenses: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get(API_ENDPOINTS.EXPENSES.TOTAL, { params });
    return response.data;
  }
};
