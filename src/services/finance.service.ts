import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const invoiceService = {
  getInvoices: async (page = 1, limit = 10, search = "", status = "", startDate = "", endDate = "") => {
    const params: any = { page, limit, search, status };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosInstance.get(API_ENDPOINTS.INVOICES.GET_ALL, { params });
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
  },

  generatePDFDirect: async (invoiceData: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.INVOICES.GENERATE_PDF_DIRECT, invoiceData, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const paymentService = {
  getPayments: async (page = 1, limit = 10, search = "", startDate = "", endDate = "") => {
    const params: any = { page, limit, search };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENTS.GET_ALL, { params });
    return response.data;
  },

  createPayment: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENTS.CREATE, data);
    return response.data.data;
  }
};
