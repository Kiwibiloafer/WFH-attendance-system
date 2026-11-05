import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { EmployeeDashboard } from '../features/employee/EmployeeDashboard';
import { EmployeeListPage } from '../features/admin/EmployeeListPage';
import { AttendanceForm } from '../features/employee/AttendanceForm';
import { AttendanceHistory } from '../features/employee/AttendanceHistory';
import { AttendanceMonitoringPage } from '../features/admin/AttendanceMonitoringPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<EmployeeDashboard />} />

              {/* HR Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['HR_ADMIN']} />}>
                <Route path="/admin/employees" element={<EmployeeListPage />} />
                <Route path="/admin/attendances" element={<AttendanceMonitoringPage />} />
              </Route>

              {/* Employee Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
                <Route path="/attendance/submit" element={<AttendanceForm />} />
                <Route path="/attendance/history" element={<AttendanceHistory />} />
              </Route>

              {/* Default fallback inside layout */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
