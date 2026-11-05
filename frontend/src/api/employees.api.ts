import { http } from './http';
import type { 
  EmployeeProfile, 
  PaginatedResult, 
  CreateEmployeePayload, 
  UpdateEmployeePayload 
} from '../types';

export interface QueryEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
}

export const employeesApi = {
  getEmployees: async (params: QueryEmployeesParams = {}): Promise<PaginatedResult<EmployeeProfile>> => {
    const response = await http.get<PaginatedResult<EmployeeProfile>>('/employees', { params });
    return response.data;
  },

  getEmployeeById: async (id: number): Promise<EmployeeProfile> => {
    const response = await http.get<EmployeeProfile>(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (payload: CreateEmployeePayload): Promise<EmployeeProfile> => {
    const response = await http.post<EmployeeProfile>('/employees', payload);
    return response.data;
  },

  updateEmployee: async (id: number, payload: UpdateEmployeePayload): Promise<EmployeeProfile> => {
    const response = await http.patch<EmployeeProfile>(`/employees/${id}`, payload);
    return response.data;
  },

  updateEmployeeStatus: async (id: number, isActive: boolean): Promise<EmployeeProfile> => {
    const response = await http.patch<EmployeeProfile>(`/employees/${id}/status`, { isActive });
    return response.data;
  },
};
