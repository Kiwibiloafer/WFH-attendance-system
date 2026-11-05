export type RoleName = 'HR_ADMIN' | 'EMPLOYEE';

export interface User {
  id: number;
  email: string;
  role: RoleName;
  isActive: boolean;
  lastLoginAt?: string | null;
  employee?: EmployeeProfile | null;
}

export interface EmployeeProfile {
  id: number;
  userId: number;
  employeeNumber: string;
  fullName: string;
  department: string;
  position?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    isActive: boolean;
    lastLoginAt?: string | null;
  };
}

export interface AttendancePhoto {
  id: number;
  attendanceId: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  attendanceDate: string;
  submittedAt: string;
  workDescription: string;
  notes?: string | null;
  createdAt: string;
  employee?: {
    id: number;
    employeeNumber: string;
    fullName: string;
    department: string;
    position?: string | null;
  };
  photo?: AttendancePhoto | null;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: RoleName;
    employee?: {
      id: number;
      employeeNumber: string;
      fullName: string;
      department: string;
      position?: string | null;
    } | null;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateEmployeePayload {
  employeeNumber: string;
  fullName: string;
  email: string;
  department: string;
  position?: string;
  phone?: string;
  temporaryPassword: string;
}

export interface UpdateEmployeePayload {
  fullName?: string;
  department?: string;
  position?: string;
  phone?: string;
}
