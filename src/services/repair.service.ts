import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const repairService = {
  getRepairs: async (page = 1, limit = 10, search = "", status = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPAIRS.GET_ALL, {
      params: { page, limit, search, status }
    });
    return response.data;
  },

  getRepairsLookup: async (status = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPAIRS.GET_ALL, {
      params: { all: true, status }
    });
    return response.data;
  },

  getRepairById: async (id: string) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.REPAIRS.GET_BY_ID}/${id}`);
    return response.data.data;
  },

  createRepair: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.REPAIRS.CREATE, data);
    return response.data.data;
  },

  updateRepair: async (id: string, data: any) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.REPAIRS.UPDATE}/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.REPAIRS.UPDATE_STATUS.replace(':id', id), {
      status,
      notes
    });
    return response.data.data;
  },

  getTimeline: async (id: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPAIRS.TIMELINE.replace(':id', id));
    return response.data.data;
  },

  deleteRepairJob: async (id: string) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.REPAIRS.DELETE}/${id}`);
    return response.data;
  }
};
