import React, { useEffect, useState, useCallback } from 'react';
import type { EmployeeProfile } from '../../types';
import { employeesApi } from '../../api/employees.api';
import { EmployeeModal } from './EmployeeModal';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  Power,
  Plus,
  Search,
  Users
} from 'lucide-react';

const DEPARTMENTS = [
  'Semua Departemen',
  'Engineering',
  'Product Management',
  'Quality Assurance',
  'Human Resources',
  'Finance & Accounting',
  'Marketing & Sales',
  'Supply Chain & Operations',
];

export const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('Semua Departemen');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        search: searchTerm.trim() || undefined,
        department: selectedDept !== 'Semua Departemen' ? selectedDept : undefined,
      };
      const result = await employeesApi.getEmployees(params);
      setEmployees(result.data);
      setTotalPages(result.meta.totalPages);
      setTotalCount(result.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat daftar karyawan.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedDept]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleToggleStatus = async (employee: EmployeeProfile) => {
    const currentStatus = employee.user?.isActive ?? true;
    const newStatus = !currentStatus;
    const confirmMsg = newStatus
      ? `Aktifkan kembali akun karyawan ${employee.fullName} (${employee.employeeNumber})?`
      : `Nonaktifkan akun karyawan ${employee.fullName} (${employee.employeeNumber})? Karyawan tidak akan dapat login atau absen.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await employeesApi.updateEmployeeStatus(employee.id, newStatus);
      setNotification(
        `Status akun ${employee.fullName} berhasil diubah menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}.`
      );
      setTimeout(() => setNotification(null), 4000);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status akun.');
    }
  };

  const handleEdit = (employee: EmployeeProfile) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-blue-700" />
            <span>Master Data Karyawan</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data profil, akun login, dan status aktif seluruh karyawan.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs font-medium animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama, NIP, atau email..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 md:w-64">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 transition-colors"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  NIP & Nama
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Departemen & Jabatan
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Email & Telepon
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Status Akun
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Login Terakhir
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Memuat data karyawan...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data karyawan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isActive = emp.user?.isActive ?? true;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-xs font-mono text-slate-500">{emp.employeeNumber}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{emp.department}</div>
                        <div className="text-xs text-slate-500">{emp.position || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700">{emp.user?.email}</div>
                        <div className="text-xs text-slate-400">{emp.phone || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {emp.user?.lastLoginAt
                          ? new Date(emp.user.lastLoginAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                          : 'Belum pernah'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(emp)}
                            title="Edit data karyawan"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(emp)}
                            title={isActive ? 'Nonaktifkan akun karyawan' : 'Aktifkan akun karyawan'}
                            className={`p-1.5 rounded-md transition-colors ${isActive
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan data <strong>{employees.length}</strong> dari total <strong>{totalCount}</strong> karyawan
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setNotification(
            selectedEmployee
              ? 'Data karyawan berhasil diperbarui.'
              : 'Karyawan baru berhasil didaftarkan.'
          );
          setTimeout(() => setNotification(null), 4000);
          fetchEmployees();
        }}
        employeeToEdit={selectedEmployee}
      />
    </div>
  );
};
