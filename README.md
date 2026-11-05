# WFH Employee Attendance & Monitoring System

A robust, enterprise-grade web application designed for managing and monitoring Work From Home (WFH) employee attendance, daily work descriptions, and photographic evidence.

Built with **NestJS**, **React.js + TypeScript**, **Prisma ORM**, **MySQL 8.4**, and **MinIO S3-Compatible Object Storage**.

---

## 🚀 Key Features

### 1. Peran Karyawan (Employee)
- **Autentikasi JWT**: Login menggunakan akun yang didaftarkan oleh HR Admin.
- **Authoritative Server Timestamp**: Waktu kehadiran dan tanggal absensi dicatat secara otoritatif oleh server backend (timezone default: `Asia/Jakarta`). Jam lokal browser tidak dipercaya.
- **1 Absensi per Hari Kalender**: Sistem menjamin setiap karyawan hanya dapat mengirimkan 1 kali absensi per hari kalender, dicegah secara atomik pada level database (`UNIQUE(employee_id, attendance_date)`).
- **Mandatory Daily Work Description (`work_description`)**: Wajib mengisi deskripsi tugas dan pekerjaan yang diselesaikan pada hari WFH tersebut.
- **Unggah Foto Bukti WFH**: Wajib melampirkan foto kondisi kerja (format JPG, PNG, WebP &middot; maksimal 5 MB).
- **Penyimpanan MinIO S3 Aman**: Foto diunggah langsung ke MinIO object storage dengan UUID acak dan nama direktori terstruktur.
- **Dashboard & Riwayat Absensi**: Menampilkan status absensi hari ini secara *real-time* dan riwayat absensi pribadi (read-only).

### 2. Peran HR Admin (Human Resources)
- **Manajemen Master Data Karyawan (CRUD)**:
  - Membuat akun karyawan baru beserta password sementara (di-hash menggunakan bcrypt).
  - Mengubah profil karyawan (nama, departemen, jabatan, nomor telepon).
  - Mengaktifkan atau menonaktifkan akun karyawan (*toggle status*). Karyawan yang dinonaktifkan tidak dapat login atau absen, namun riwayat kehadiran tetap tersimpan utuh.
- **Dashboard Monitoring Absensi & Output WFH**:
  - Tabel monitoring absensi seluruh karyawan secara *real-time*.
  - **Work Description Visibility**: Menampilkan deskripsi output pekerjaan karyawan secara langsung pada tabel monitoring dan modal detail.
  - **Filter Komprehensif**: Filter berdasarkan rentang tanggal (*from & to date*), departemen, dan pencarian instan (nama karyawan atau NIP).
  - **Streaming Foto Bukti Aman**: Foto disiarkan melalui authenticated proxy endpoint backend tanpa membuka akses publik langsung ke bucket MinIO.
  - **Strict Read-Only Enforcement**: Sesuai kepatuhan audit internal, data absensi dan bukti foto bersifat mutlak *read-only* bagi HR Admin (tidak ada endpoint update/delete absensi).

### 3. Kualitas Rekayasa Perangkat Lunak (Engineering Standards)
- **Human-Crafted Enterprise UI**: Antarmuka bersih bernuansa korporat modern (slate neutral, tipografi jelas, border rapi, badge status kontras, **bebas dari gaya AI-slop**).
- **Atomisitas Transaksi & Rollback MinIO**: Jika transaksi database MySQL gagal, file yang sudah terunggah ke MinIO otomatis dibersihkan (*rollback cleanup*) untuk mencegah file yatim (*orphaned objects*).
- **Dokumentasi Interaktif Swagger OpenAPI**: Terintegrasi di `/api/docs`.
- **Pengujian Otomatis Menyeluruh**: Dilengkapi pengujian unit dan pengujian integrasi E2E end-to-end (Vitest + Supertest).

---

## 🛠️ Tech Stack

| Layer | Teknologi | Versi / Keterangan |
|---|---|---|
| **Frontend** | React.js + TypeScript | React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios |
| **Backend** | NestJS + TypeScript | NestJS 12, Express, Passport JWT, Multer |
| **Database** | MySQL | MySQL 8.4 (Containerized Docker Compose) |
| **ORM** | Prisma | Prisma 6.4 LTS |
| **Object Storage** | MinIO (S3-Compatible) | `@aws-sdk/client-s3`, Bucket: `wfh-attendance-photos` |
| **Containerization**| Docker Compose | Multi-container setup (MySQL port 3307, MinIO port 9000/9001) |
| **Dokumentasi API** | Swagger OpenAPI | Endpoint: `http://localhost:3000/api/docs` |

---

## 📋 Struktur Direktori Proyek

```text
wfh-absen-dexa/
├── docker-compose.yml       # MySQL 8.4 + MinIO configuration
├── implementation.md        # Technical specifications & architecture plan
├── README.md                # Project documentation
├── .gitignore               # Root git ignore (clean environment, zero AI bloat)
│
├── backend/                 # NestJS Application
│   ├── .env & .env.example
│   ├── prisma/
│   │   ├── schema.prisma    # MySQL Database Schema
│   │   ├── migrations/      # Version-controlled SQL migrations
│   │   └── seed.ts          # Default seed data (HR Admin & Employees)
│   ├── src/
│   │   ├── auth/            # JWT authentication & strategies
│   │   ├── common/          # RBAC Guards, Decorators, Validation
│   │   ├── employees/       # Employee master data CRUD & status toggle
│   │   ├── uploads/         # MinIO S3 client service & stream handler
│   │   ├── attendance/      # WFH attendance submission & HR monitoring
│   │   ├── prisma/          # Prisma database connection service
│   │   └── main.ts          # Application bootstrap & Swagger config
│   └── test/                # Automated E2E test suites (Phase 2, 3, 4)
│
└── frontend/                # React.js Vite Application
    ├── .env & .env.example
    ├── src/
    │   ├── api/             # Axios API services (Auth, Employees, Attendance)
    │   ├── app/             # Router & Context Providers
    │   ├── components/      # Layout (Navbar, Footer) & ProtectedRoute
    │   ├── features/
    │   │   ├── auth/        # LoginPage with Quick-Fill Evaluator buttons
    │   │   ├── employee/    # Dashboard, AttendanceForm, AttendanceHistory
    │   │   └── admin/       # EmployeeListPage, EmployeeModal, AttendanceMonitoringPage, AttendanceDetailModal
    │   └── types/           # TypeScript Domain Definitions
```

---

## ⚙️ Panduan Menjalankan Aplikasi (Local Run Instructions)

### 1. Prasyarat Sistem
Pastikan telah terpasang:
- **Node.js** (v20.x atau lebih baru)
- **npm** (v10.x atau lebih baru)
- **Docker Desktop** (sudah aktif dan berjalan)

---

### 2. Jalankan Infrastruktur Kontainer (MySQL & MinIO)
Buka terminal pada root direktori proyek (`wfh-absen-dexa`):

```bash
# Menjalankan kontainer MySQL 8.4 dan MinIO di background
docker compose up -d
```

> **Catatan Port:**
> - MySQL berjalan di port `3307` pada host (dipetakan ke port internal 3306 untuk mencegah bentrok dengan MySQL lokal).
> - MinIO S3 API: `http://localhost:9000`
> - MinIO Web Console: `http://localhost:9001` (User: `minio_admin`, Password: `minio_dev_password`)
> - Bucket `wfh-attendance-photos` dibuat otomatis saat layanan backend pertama kali diinisialisasi.

---

### 3. Setup & Jalankan Backend (NestJS)
Buka terminal baru:

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Jalankan migrasi database
npx prisma migrate dev

# 3. Masukkan data awal (Seeding)
npx prisma db seed

# 4. Jalankan backend development server
npm run start:dev
```

Backend API akan aktif di:
- **API Base URL:** `http://localhost:3000/api/v1`
- **Swagger Documentation:** `http://localhost:3000/api/docs`

---

### 4. Setup & Jalankan Frontend (React + Vite)
Buka terminal baru:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Jalankan frontend development server
npm run dev
```

Buka browser pada alamat:
- **Web Portal:** `http://localhost:5173`

---

## 👤 Kredensial Pengujian (Demo Evaluator Accounts)

Pada halaman login (`http://localhost:5173/login`), telah disediakan tombol **Akses Cepat Pengujian (Quick-Fill)** untuk mempermudah evaluasi tanpa perlu mengetik manual:

| Peran (Role) | Alamat Email | Password | Keterangan |
|---|---|---|---|
| **HR Admin** | `hr@dexa.com` | `Password123!` | Akses penuh: Master Karyawan, Monitoring Absensi & Foto MinIO |
| **Employee 1** | `employee@dexa.com` | `Password123!` | NIP: `EMP-001` &middot; Budi Pratama (Engineering) |
| **Employee 2** | `siti@dexa.com` | `Password123!` | NIP: `EMP-002` &middot; Siti Rahmawati (Product Management) |

---

## 🧪 Menjalankan Pengujian Otomatis (Automated Tests)

Backend dilengkapi dengan pengujian unit dan pengujian integrasi E2E komprehensif:

```bash
cd backend

# Menjalankan Unit Tests (AuthService, EmployeesService, AttendanceService)
npm test

# Menjalankan End-to-End (E2E) Integration Tests
npm run test:e2e
```

### Cakupan Pengujian:
1. **Autentikasi & RBAC**: Verifikasi kredensial, token JWT, penolakan password salah, penolakan akun nonaktif.
2. **Karyawan**: Pembuatan karyawan dalam transaksi, penolakan NIP/email duplikat (409), aktivasi/deaktivasi akun, pembatasan akses non-HR (403).
3. **Absensi & MinIO**: Validasi ukuran foto (maks 5 MB) dan format MIME, validasi deskripsi kerja wajib, pencatatan waktu otoritatif server, pencegahan absensi ganda per hari kalender (409 Conflict), streaming foto bukti dari MinIO, dan verifikasi *rollback cleanup* objek MinIO saat terjadi kesalahan database.
4. **Monitoring & Read-Only**: Filter monitoring HR, detail absensi, serta penolakan rute mutasi absensi (PUT/PATCH/DELETE).

---

## 🛡️ Checklist Keamanan & Kepatuhan
- [x] Password pengguna di-hash secara aman menggunakan algoritma **bcrypt** (salt rounds 10).
- [x] Autentikasi JWT divalidasi pada setiap request terproteksi dengan masa berlaku terkontrol.
- [x] Otorisasi Role-Based Access Control (RBAC) ditegakkan secara ketat di sisi server backend.
- [x] Identitas karyawan diambil dari token JWT yang terverifikasi, bukan dari input body request.
- [x] Karyawan hanya dapat melihat riwayat dan foto bukti kehadiran miliknya sendiri.
- [x] HR Admin memiliki hak akses pemantauan yang bersifat mutlak **read-only** untuk data absensi.
- [x] File foto bukti kehadiran divalidasi tipe MIME dan batas ukuran (maksimal 5 MB).
- [x] Bucket MinIO bersifat privat; akses foto dialirkan melalui proxy terotentikasi (*authenticated streaming*).
- [x] Sanitasi nama file dan pembuatan UUID acak untuk menghindari *path traversal*.
- [x] DTO Validation Pipe aktif secara global dengan opsi `whitelist: true` dan `forbidNonWhitelisted: true`.
- [x] Database query diproteksi dari SQL Injection menggunakan Prisma ORM.
- [x] File `.env` dan direktori dependensi dikecualikan dari version control melalui `.gitignore`.

