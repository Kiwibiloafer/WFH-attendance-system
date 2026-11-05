import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { attendanceApi, type TodayStatusResponse } from '../../api/attendance.api';
import { 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Camera, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Users 
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'HR_ADMIN';

  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (!isHr) {
      setLoadingStatus(true);
      attendanceApi
        .getTodayStatus()
        .then((res) => setTodayStatus(res))
        .catch((err) => console.error('Failed to get today status:', err))
        .finally(() => setLoadingStatus(false));
    }
  }, [isHr]);

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (isHr) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-700/20 mb-2">
                HR Administration Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Selamat Datang, {user?.employee?.fullName || 'HR Admin'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kelola master data karyawan dan pantau bukti kehadiran serta output harian WFH.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{todayStr}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Manajemen Data Karyawan</h3>
              <p className="mt-1 text-sm text-slate-500">
                Buat akun karyawan baru, perbarui data master, serta aktifkan atau nonaktifkan akun karyawan.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/admin/employees"
                className="inline-flex items-center space-x-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <span>Buka Master Karyawan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Monitoring Absensi WFH</h3>
              <p className="mt-1 text-sm text-slate-500">
                Pantau rekapan absensi harian, periksa laporan deskripsi pekerjaan, dan lihat foto bukti WFH yang tersimpan di MinIO.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/admin/attendances"
                className="inline-flex items-center space-x-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                <span>Lihat Monitoring Absensi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSubmittedToday = todayStatus?.submitted;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/20">
                Employee Portal
              </span>
              <span className="text-xs font-mono text-slate-400">
                NIP: {user?.employee?.employeeNumber || '-'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Halo, {user?.employee?.fullName || 'Karyawan'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {user?.employee?.position || 'Staff'} &bull; {user?.employee?.department || 'Department'}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{todayStr}</span>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900">
                Status Kehadiran Work From Home Hari Ini
              </h2>
              {loadingStatus ? (
                <span className="text-xs text-slate-400">Memeriksa status...</span>
              ) : isSubmittedToday ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Sudah Absen Hari Ini
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Belum Mengisi Absensi
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Setiap karyawan dapat melakukan 1 kali pengisian absensi per hari kalender. Pastikan mengisi deskripsi pekerjaan dan mengunggah foto bukti kerja.
            </p>

            {isSubmittedToday && todayStatus?.attendance ? (
              <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-start space-x-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed text-slate-600">
                  <p>
                    <strong>Waktu Submit:</strong>{' '}
                    {new Date(todayStatus.attendance.submittedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    })}
                  </p>
                  <p className="line-clamp-2">
                    <strong>Pekerjaan:</strong> {todayStatus.attendance.workDescription}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex items-start space-x-3 text-sm text-slate-700">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed text-slate-600">
                  <p>
                    <strong>Server Authoritative Time:</strong> Waktu kehadiran dan tanggal dicatat otomatis oleh server backend (Asia/Jakarta), bukan waktu perangkat browser.
                  </p>
                  <p>
                    <strong>Bukti Wajib:</strong> Lampirkan foto kondisi kerja WFH (maks. 5 MB) dan deskripsi tugas yang diselesaikan.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/attendance/submit"
              className={`inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg shadow-xs transition-colors ${
                isSubmittedToday
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isSubmittedToday ? 'Lihat Detail Absen Hari Ini' : 'Submit Absen WFH Sekarang'}</span>
            </Link>
            <Link
              to="/attendance/history"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Lihat Riwayat Saya</span>
            </Link>
          </div>
        </div>

        {/* Requirements Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider text-xs text-slate-400">
              Ketentuan Absensi
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>1 Kali pengisian per hari kalender</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Deskripsi pekerjaan wajib diisi</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Foto bukti format JPG/PNG/WebP maks. 5 MB</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Data tersimpan read-only untuk integritas audit</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Penyimpanan foto aman menggunakan MinIO S3-compatible storage.
          </div>
        </div>
      </div>
    </div>
  );
};
