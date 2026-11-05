import { http } from './http';
import type { AttendanceRecord, PaginatedResult } from '../types';

export interface TodayStatusResponse {
  submitted: boolean;
  attendanceDate: string;
  attendance?: AttendanceRecord | null;
}

export interface QueryAdminAttendanceParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  from?: string;
  to?: string;
}

export const attendanceApi = {
  getTodayStatus: async (): Promise<TodayStatusResponse> => {
    const response = await http.get<TodayStatusResponse>('/attendances/today');
    return response.data;
  },

  submitAttendance: async (formData: FormData): Promise<AttendanceRecord> => {
    const response = await http.post<AttendanceRecord>('/attendances', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyAttendances: async (page = 1, limit = 10): Promise<PaginatedResult<AttendanceRecord>> => {
    const response = await http.get<PaginatedResult<AttendanceRecord>>('/attendances/me', {
      params: { page, limit },
    });
    return response.data;
  },

  getMyAttendanceDetail: async (id: number): Promise<AttendanceRecord> => {
    const response = await http.get<AttendanceRecord>(`/attendances/me/${id}`);
    return response.data;
  },

  // HR Admin Monitoring APIs
  getAdminAttendances: async (
    params: QueryAdminAttendanceParams = {},
  ): Promise<PaginatedResult<AttendanceRecord>> => {
    const response = await http.get<PaginatedResult<AttendanceRecord>>('/admin/attendances', {
      params,
    });
    return response.data;
  },

  getAdminAttendanceDetail: async (id: number): Promise<AttendanceRecord> => {
    const response = await http.get<AttendanceRecord>(`/admin/attendances/${id}`);
    return response.data;
  },
};
