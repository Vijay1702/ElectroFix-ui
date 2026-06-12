import axiosInstance from "@/api/axios";

export interface AuditLog {
  id: string;
  userId: string | null;
  menuName: string;
  action: string;
  description: string;
  referenceId: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface GetAuditLogsParams {
  page: number;
  limit: number;
  menuName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetAuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditService = {
  getAuditLogs: async (params: GetAuditLogsParams): Promise<GetAuditLogsResponse> => {
    const response = await axiosInstance.get('/audit', { params });
    return response.data;
  }
};
