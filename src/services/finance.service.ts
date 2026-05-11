import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const invoiceService = {
  getInvoices: async (page = 1, limit = 10, search = "", status = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.INVOICES.GET_ALL, {
      params: { page, limit, search, status }
    });
    return response.data;
  },

  getInvoiceById: async (id: string) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.INVOICES.GET_BY_ID}/${id}`);
    return response.data.data;
  },

  createInvoice: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.INVOICES.CREATE, data);
    return response.data.data;
  },

  generatePDF: async (id: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.INVOICES.GENERATE_PDF.replace(':id', id), {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const paymentService = {
  getPayments: async (page = 1, limit = 10, search = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENTS.GET_ALL, {
      params: { page, limit, search }
    });
    return response.data;
  },

  createPayment: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENTS.CREATE, data);
    return response.data.data;
  }
};
