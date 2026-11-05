import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthImage } from '../../components/ui/AuthImage';
import { attendanceApi, type TodayStatusResponse } from '../../api/attendance.api';
import { 
  AlertCircle, 
  CalendarCheck, 
  Camera, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Info, 
  ShieldCheck, 
  Upload, 
  X 
} from 'lucide-react';

export const AttendanceForm: React.FC = () => {
  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Form states
  const [workDescription, setWorkDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTodayStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await attendanceApi.getTodayStatus();
      setTodayStatus(res);
    } catch (err: any) {
      console.error('Failed to fetch today attendance status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validMimes.includes(file.type)) {
      setError('Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file foto melebihi batas 5 MB.');
      return;
    }

    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!workDescription.trim()) {
      setError('Deskripsi pekerjaan (work description) wajib diisi.');
      return;
    }

    if (!photoFile) {
      setError('Foto bukti kehadiran WFH wajib diunggah.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('workDescription', workDescription.trim());
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    try {
      setIsSubmitting(true);
      const result = await attendanceApi.submitAttendance(formData);
      setSuccessMessage('Absensi WFH hari ini berhasil dicatat oleh server!');
      setTodayStatus({
        submitted: true,
        attendanceDate: result.attendanceDate,
        attendance: result,
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Terjadi kesalahan saat menyerahkan absensi.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-sm">Memeriksa status kehadiran hari ini...</span>
      </div>
    );
  }

  // If already submitted today, render confirmation card
  if (todayStatus?.submitted && todayStatus.attendance) {
    const att = todayStatus.attendance;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-emerald-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-start space-x-3.5 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/20 mb-1">
                Absensi Hari Ini Selesai
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Kehadiran WFH Anda Telah Tercatat
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tanggal Bisnis:{' '}
                <strong>
                  {new Date(att.attendanceDate).toLocaleDateString('id-ID', {
                    dateStyle: 'long',
                  })}
                </strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Waktu Submit (Server Backend)
                </span>
                <div className="flex items-center space-x-1.5 text-slate-900 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {new Date(att.submittedAt).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Deskripsi Pekerjaan Harian
                </span>
                <div className="p-3 bg-white border border-slate-200 rounded-md text-slate-800 whitespace-pre-line leading-relaxed font-mono">
                  {att.workDescription}
                </div>
              </div>

              {att.notes && (
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Catatan Tambahan
                  </span>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-md text-slate-700">
                    {att.notes}
                  </div>
                </div>
              )}
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Foto Bukti Kehadiran WFH
              </span>
              {att.photo ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <AuthImage
                    src={att.photo.url}
                    alt="Bukti Kehadiran WFH"
                    className="w-full h-48 sm:h-56 object-cover"
                    containerClassName="w-full h-48 sm:h-56"
                  />
                  <div className="p-2.5 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <span className="truncate">{att.photo.originalName}</span>
                    <span className="font-mono text-slate-400 shrink-0">
                      {(att.photo.fileSize / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-lg">
                  Foto tidak tersedia
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Data absensi bersifat <strong>read-only</strong> dan tersimpan aman di database serta MinIO.
              </span>
            </div>

            <Link
              to="/attendance/history"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lihat Riwayat Absensi</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <CalendarCheck className="w-6 h-6 text-blue-700" />
          <span>Form Absensi Harian WFH</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Isi deskripsi pekerjaan yang dikerjakan hari ini dan lampirkan foto bukti kondisi kerja WFH Anda.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Server Time Notice */}
        <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>
              Waktu Kehadiran: <strong>Dicatat otomatis oleh server (Asia/Jakarta)</strong>
            </span>
          </div>
          <span className="font-mono text-slate-400">1x per hari kalender</span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Daily Work Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Deskripsi Pekerjaan Hari Ini (Work Description) *
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {workDescription.length} karakter
              </span>
            </div>
            <textarea
              required
              rows={5}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="- Mengembangkan modul monitoring absensi&#10;- Melakukan code review dan unit testing&#10;- Mengintegrasikan storage MinIO S3"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-sans leading-relaxed transition-colors"
            />
            <p className="mt-1.5 text-xs text-slate-500 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Deskripsi ini wajib diisi dan akan dipantau oleh HR Admin sebagai laporan output kerja.</span>
            </p>
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Foto Bukti Kehadiran WFH *
            </label>

            {!photoPreview ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    Tarik dan lepaskan file foto di sini, atau <span className="text-blue-700 underline">pilih dari perangkat</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Format: JPG, PNG, WebP &middot; Maksimal 5 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 group max-w-md">
                <img
                  src={photoPreview}
                  alt="Preview Bukti WFH"
                  className="w-full h-64 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 bg-slate-900/70 hover:bg-rose-600 text-white rounded-lg backdrop-blur-xs transition-colors"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950/80 to-transparent text-white text-xs flex justify-between items-center">
                  <span className="truncate max-w-[200px]">{photoFile?.name}</span>
                  <span className="font-mono text-slate-300">
                    {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pekerjaan selesai tepat waktu, standby komunikasi via Slack."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Foto disimpan aman di MinIO Object Storage</span>
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengunggah & Menyimpan...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Submit Absensi WFH</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
