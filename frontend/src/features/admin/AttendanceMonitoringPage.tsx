import React, { useEffect, useState, useCallback } from 'react';
import type { AttendanceRecord } from '../../types';
import { attendanceApi } from '../../api/attendance.api';
import { AttendanceDetailModal } from './AttendanceDetailModal';
import { AuthImage } from '../../components/ui/AuthImage';
import { 
  AlertCircle, 
  Building2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  Filter, 
  RotateCcw, 
  Search, 
  ShieldCheck, 
  User 
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

export const AttendanceMonitoringPage: React.FC = () => {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('Semua Departemen');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        search: searchTerm.trim() || undefined,
        department: selectedDept !== 'Semua Departemen' ? selectedDept : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      };
      const res = await attendanceApi.getAdminAttendances(params);
      setAttendances(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data monitoring absensi.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedDept, fromDate, toDate]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedDept('Semua Departemen');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleOpenDetail = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-700" />
            <span>Monitoring Absensi & Output WFH</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pengawasan kehadiran kerja, laporan output pekerjaan harian, dan bukti foto seluruh karyawan.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Read-Only Audit Trail</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
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
              placeholder="Cari berdasarkan nama atau NIP karyawan..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
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

          {/* Reset Action */}
          <div className="flex justify-end">
            <button
              onClick={handleResetFilter}
              type="button"
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
            Rentang Tanggal:
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Dari:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Sampai:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-xs text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Karyawan & NIP
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Departemen
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Tanggal & Waktu Server
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Laporan Pekerjaan (Work Description)
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Foto Bukti
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
                      <span className="text-xs">Memuat data absensi...</span>
                    </div>
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">Tidak ada data absensi yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau rentang tanggal.
                    </p>
                  </td>
                </tr>
              ) : (
                attendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{rec.employee?.fullName || 'Karyawan'}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        {rec.employee?.employeeNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{rec.employee?.department || '-'}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {rec.employee?.position || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 flex items-center space-x-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(rec.attendanceDate).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center space-x-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {new Date(rec.submittedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                      <p className="text-xs font-mono text-slate-700 line-clamp-2 leading-relaxed">
                        {rec.workDescription}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rec.photo ? (
                        <div
                          onClick={() => handleOpenDetail(rec)}
                          className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all bg-slate-100 flex items-center justify-center group"
                          title="Klik untuk melihat foto"
                        >
                          <AuthImage
                            src={rec.photo.url}
                            alt="Bukti WFH"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            containerClassName="w-full h-full"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs">
                      <button
                        onClick={() => handleOpenDetail(rec)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail Absen</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan data <strong>{attendances.length}</strong> dari total <strong>{totalCount}</strong> absensi
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

      {/* Modal Detail */}
      <AttendanceDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        attendance={selectedRecord}
      />
    </div>
  );
};

