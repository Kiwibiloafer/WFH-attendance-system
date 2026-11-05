import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { AttendanceRecord } from '../../types';
import { attendanceApi } from '../../api/attendance.api';
import { AttendanceDetailModal } from '../admin/AttendanceDetailModal';
import { AuthImage } from '../../components/ui/AuthImage';
import { 
  AlertCircle, 
  Calendar, 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  FileText 
} from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await attendanceApi.getMyAttendances(page, 10);
      setAttendances(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat absensi.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenDetail = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FileText className="w-6 h-6 text-blue-700" />
            <span>Riwayat Absensi Saya</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftar lengkap kehadiran dan rekapan pekerjaan harian WFH yang telah diserahkan.
          </p>
        </div>

        <Link
          to="/attendance/submit"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Absen Hari Ini</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Deskripsi Pekerjaan (Work Description)
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Catatan
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Bukti Foto
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Memuat riwayat kehadiran...</span>
                    </div>
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">Belum ada riwayat absensi yang tercatat.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Silakan lakukan absensi WFH untuk hari ini.
                    </p>
                  </td>
                </tr>
              ) : (
                attendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <p className="text-xs font-mono text-slate-700 line-clamp-2 leading-relaxed">
                        {rec.workDescription}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-xs text-slate-500 truncate">
                      {rec.notes || '-'}
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
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
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
            Menampilkan <strong>{attendances.length}</strong> dari total <strong>{totalCount}</strong> absensi
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

      {/* Detail Modal */}
      <AttendanceDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        attendance={selectedRecord}
      />
    </div>
  );
};

