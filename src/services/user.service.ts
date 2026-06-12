import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const userService = {
  getUsers: async (page = 1, limit = 100, search = "", role = "", startDate = "", endDate = "") => {
    const params: any = { page, limit, search, role };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL, { params });
    return response.data;
  },

  getUsersLookup: async (role = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL, {
      params: { all: true, role }
    });
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await axiosInstance.post(API_ENDPOINTS.USERS.CREATE, data);
    return response.data.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.USERS.UPDATE}/${id}`, data);
    return response.data.data;
  },
  deleteUser: async (id: string) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.USERS.DELETE}/${id}`);
    return response.data.data;
  }
};
