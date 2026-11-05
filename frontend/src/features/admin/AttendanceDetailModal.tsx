import React from 'react';
import type { AttendanceRecord } from '../../types';
import { AuthImage } from '../../components/ui/AuthImage';
import { 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  ShieldCheck, 
  User, 
  X 
} from 'lucide-react';

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: AttendanceRecord | null;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  attendance,
}) => {
  if (!isOpen || !attendance) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Detail Absensi Work From Home
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ID Absensi: #{attendance.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Employee & Timestamp Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                Data Karyawan
              </span>
              <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{attendance.employee?.fullName || 'Karyawan'}</span>
              </div>
              <div className="text-slate-500 font-mono">
                NIP: {attendance.employee?.employeeNumber || '-'}
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {attendance.employee?.department || '-'} &bull;{' '}
                  {attendance.employee?.position || '-'}
                </span>
              </div>
            </div>

            <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                Waktu & Tanggal Server
              </span>
              <div className="flex items-center space-x-2 text-slate-900 font-medium">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {new Date(attendance.attendanceDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Submit:{' '}
                  {new Date(attendance.submittedAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short',
                  })}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Zona Waktu: Asia/Jakarta (Server Authoritative)
              </div>
            </div>
          </div>

          {/* Daily Work Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Deskripsi Pekerjaan Harian (Work Description)</span>
              </h4>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                Output WFH Wajib
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono leading-relaxed whitespace-pre-line">
              {attendance.workDescription}
            </div>
          </div>

          {/* Notes if available */}
          {attendance.notes && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Tambahan
              </h4>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs">
                {attendance.notes}
              </div>
            </div>
          )}

          {/* Evidence Photo */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Foto Bukti Kehadiran WFH (MinIO Object Storage)
            </h4>
            {attendance.photo ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
                <AuthImage
                  src={attendance.photo.url}
                  alt="Bukti Kehadiran WFH"
                  className="w-full max-h-96 object-contain mx-auto"
                />
                <div className="p-3 bg-slate-950/90 text-white text-xs flex justify-between items-center">
                  <span className="truncate">{attendance.photo?.originalName}</span>
                  <span className="font-mono text-slate-400">
                    {attendance.photo?.fileSize
                      ? `${(attendance.photo.fileSize / 1024).toFixed(0)} KB`
                      : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                Foto bukti tidak ditemukan atau tidak tersedia.
              </div>
            )}
          </div>

          {/* Audit Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Catatan absensi bersifat <strong>read-only</strong>. Tidak dapat diubah atau dihapus untuk menjaga keabsahan audit internal.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

