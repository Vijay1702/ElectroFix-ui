import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const notificationService = {
  getNotifications: async () => {
    const res = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
    return res.data;
  },
  
  getUnreadNotifications: async () => {
    const res = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD);
    return res.data;
  },
  
  markAsRead: async (id: string) => {
    const res = await axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(':id', id));
    return res.data;
  },
  
  markAllAsRead: async () => {
    const res = await axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ);
    return res.data;
  }
};
