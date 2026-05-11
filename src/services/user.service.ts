import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const userService = {
  getUsers: async (page = 1, limit = 100, search = "", role = "") => {
    const response = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL, {
      params: { page, limit, search, role }
    });
    return response.data;
  }
};
