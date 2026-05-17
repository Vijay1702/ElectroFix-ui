import axiosInstance from "@/api/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export const attendanceService = {
  getAttendance: async (params: { date?: string; employeeId?: string; month?: number; year?: number } = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE.GET_ALL, {
      params,
    });
    return response.data.data;
  },

  saveAttendanceBulk: async (date: string, records: { employeeId: string; status: string }[]) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE.BULK, {
      date,
      records,
    });
    return response.data.data;
  },

  getPayroll: async (month: number, year: number) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE.PAYROLL, {
      params: { month, year },
    });
    return response.data.data;
  },
};
