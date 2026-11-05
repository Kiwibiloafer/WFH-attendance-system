# Implementation Plan --- WFH Employee Attendance & Monitoring System

## 1. Project Overview

Build a web-based application with two roles:

-   **Employee**: logs in, views their attendance history, and submits a
    WFH attendance record with an automatically captured date/time and a
    photo as proof of working from home.
-   **HR Admin**: manages employee master data and views submitted
    attendance records. Attendance records are read-only for HR.

The implementation will use the technologies requested in the skill
test:

| Layer | Technology |
|---|---|
| Frontend | React.js + TypeScript |
| Backend | NestJS + TypeScript |
| Database | MySQL |
| ORM | Prisma |
| Authentication | JWT + RBAC |
| Object Storage | MinIO (S3-compatible) |
| Containerization | Docker Compose |
| API Documentation | Swagger |

> **Architecture decision:** Start with a modular NestJS application
> with clearly separated domain modules and service interfaces. This
> keeps the solution practical and maintainable while
> demonstrating microservice-oriented boundaries. MySQL and MinIO are
> provisioned locally using Docker Compose, providing a production-grade
> foundation with S3-compatible object storage.

## 2. Scope and Assumptions

### In scope

1.  Employee and HR Admin login.
2.  Role-based access control (RBAC).
3.  HR Admin can create, view, update, activate, and deactivate employee
    records.
4.  Employee can view their own profile and attendance history.
5.  Employee can submit a WFH attendance record.
6.  The server captures the attendance timestamp.
7.  Employee must provide a mandatory daily work description (`work_description`).
8.  Employee must upload a photo as attendance evidence (persisted to MinIO object storage).
9.  HR Admin can view attendance records, daily work descriptions, and photo evidence, but cannot
    edit or delete them.
10. Containerized MySQL and MinIO infrastructure via Docker Compose.
11. Validation, error handling, and API documentation via Swagger.

### Assumptions to confirm against the email brief

-   Each employee can submit **one attendance record per calendar day**.
-   Attendance is WFH-only; no office check-in/check-out flow is
    required.
-   The backend server timestamp is the authoritative attendance time.
    The browser's clock is not trusted.
-   **Daily work description (`work_description`) is mandatory** upon submission.
-   The uploaded photo is required and limited by file type (JPEG, PNG, WebP) and size (max 5 MB).
-   Attendance photos are stored in MinIO (S3-compatible object storage), while photo metadata and work descriptions are stored in MySQL.
-   HR Admin has read-only access to attendance, while employee master
    data is editable.
-   Employee accounts are created by HR Admin. Public employee
    registration is not provided.
-   Password reset, geolocation, selfie verification, face recognition,
    payroll, leave management, and notifications are outside the initial
    scope unless requested.

## 3. Roles and Permissions

  Feature                               Employee      HR Admin
  -------------------------------- ------------- -------------
  Login / logout                             Yes           Yes
  View own profile                           Yes           Yes
  View own attendance history                Yes           Yes
  Submit WFH attendance                      Yes            No
  View all employee data                      No           Yes
  Create employee                             No           Yes
  Update employee                             No           Yes
  Activate / deactivate employee              No           Yes
  View all attendance records                 No           Yes
  View attendance evidence photo     Own records   All records
  Edit / delete attendance                    No            No

Authorization must be enforced in the backend, not only by hiding
frontend controls.

## 4. High-Level Architecture

``` text
React Web Application
        │
        │ HTTPS / REST + JWT
        ▼
NestJS API
  ├── Auth Module
  ├── Users Module
  ├── Employees Module
  ├── Attendance Module
  ├── Uploads Module (MinIO / S3)
  └── Common Module
        │
        ├── Prisma ORM
        │       │
        │       ▼
        │     MySQL (Docker Compose)
        │
        └── S3 Client (@aws-sdk/client-s3)
                │
                ▼
          MinIO Object Storage (Docker Compose)
          (Bucket: wfh-attendance-photos)
```

### Module responsibilities

-   **AuthModule**: login, JWT issuance, password verification, and
    current-user identity.
-   **UsersModule**: account credentials, role, and account status.
-   **EmployeesModule**: employee master data and HR CRUD operations.
-   **AttendanceModule**: attendance submission, work description validation, duplicate prevention,
    history, and HR monitoring queries.
-   **UploadsModule**: photo validation, upload to MinIO via S3-compatible API, and authorized photo
    retrieval/streaming.
-   **CommonModule**: guards, decorators, filters, pipes, interceptors,
    and shared utilities.

Keep controllers focused on HTTP concerns. Put business rules in
services. Use DTOs for request validation and Prisma models for
persistence.

## 5. Database Design

Use MySQL with `utf8mb4`. Store timestamps consistently in UTC and
convert them to the user's configured timezone (for example,
`Asia/Jakarta`) in the UI.

### Entity relationship overview

``` text
Role 1 ─────── * User 1 ─────── 0..1 Employee
                         |
                         |
                         1
                         |
                         *
                    Attendance
                         |
                         1
                         |
                         0..1
                    AttendancePhoto
```

### Tables

#### `roles`

  Column       Type           Notes
  ------------ -------------- --------------------------------
  id           BIGINT / INT   Primary key
  name         VARCHAR(30)    Unique: `EMPLOYEE`, `HR_ADMIN`
  created_at   DATETIME       Creation timestamp
  updated_at   DATETIME       Last update timestamp

#### `users`

  Column          Type                 Notes
  --------------- -------------------- -------------------------------------------
  id              BIGINT / INT         Primary key
  email           VARCHAR(191)         Unique, used for login
  password_hash   VARCHAR(255)         Store hash only; never plaintext
  role_id         BIGINT / INT         FK to `roles.id`
  is_active       BOOLEAN              Prevent inactive accounts from logging in
  last_login_at   DATETIME, nullable   Last successful login
  created_at      DATETIME             Creation timestamp
  updated_at      DATETIME             Last update timestamp

#### `employees`

  Column            Type                     Notes
  ----------------- ------------------------ ----------------------------
  id                BIGINT / INT             Primary key
  user_id           BIGINT / INT             Unique FK to `users.id`
  employee_number   VARCHAR(50)              Unique employee identifier
  full_name         VARCHAR(150)             Employee name
  department        VARCHAR(100)             Department
  position          VARCHAR(100), nullable   Job title
  phone             VARCHAR(30), nullable    Contact number
  created_at        DATETIME                 Creation timestamp
  updated_at        DATETIME                 Last update timestamp

#### `attendances`

| Column | Type | Notes |
|---|---|---|
| id | BIGINT / INT | Primary key |
| employee_id | BIGINT / INT | FK to `employees.id` |
| attendance_date | DATE | Attendance business date (in configured timezone) |
| submitted_at | DATETIME | Server-generated timestamp |
| work_description | TEXT | Description of work performed that day |
| notes | VARCHAR(500), nullable | Additional notes |
| created_at | DATETIME | Creation timestamp |

> **Business rule:** `work_description` wajib diisi (`NOT NULL`) saat employee melakukan attendance submission.

Add a unique constraint on `(employee_id, attendance_date)` to prevent
multiple submissions for the same employee and day.

#### `attendance_photos`

| Column | Type | Notes |
|---|---|---|
| id | BIGINT / INT | Primary key |
| attendance_id | BIGINT / INT | Unique FK to `attendances.id` |
| file_name | VARCHAR(255) | Generated stored filename |
| original_name | VARCHAR(255) | Original upload name |
| mime_type | VARCHAR(100) | Validated MIME type (`image/jpeg`, `image/png`, `image/webp`) |
| file_size | BIGINT | Size in bytes |
| storage_path | VARCHAR(500) | MinIO object key (e.g., `photos/2026/11/04/{uuid}.jpg`) |
| created_at | DATETIME | Upload timestamp |

The photo is separated from the attendance row so storage metadata can
evolve independently. Do not store raw image binary in the attendance
table; store files in MinIO (S3-compatible) and retain metadata and object keys here.

### Important indexes and constraints

-   Unique: `users.email`
-   Unique: `employees.employee_number`
-   Unique: `employees.user_id`
-   Unique: `attendances(employee_id, attendance_date)`
-   Unique: `attendance_photos.attendance_id`
-   Index: `attendances(attendance_date)`
-   Index: `attendances(employee_id, submitted_at)`
-   Foreign keys should use restrictive deletion behavior for attendance
    history. Prefer deactivation over deleting employees who have
    attendance records.

## 6. REST API Design

Base path: `/api/v1`

All protected endpoints require:

``` http
Authorization: Bearer <access_token>
```

### Authentication

  -----------------------------------------------------------------------
  Method            Endpoint          Access            Purpose
  ----------------- ----------------- ----------------- -----------------
  POST              `/auth/login`     Public            Authenticate and
                                                        return JWT

  GET               `/auth/me`        Authenticated     Get current
                                                        account and
                                                        employee profile
  -----------------------------------------------------------------------

Example login request:

``` json
{
  "email": "employee@example.com",
  "password": "your-password"
}
```

Example response:

``` json
{
  "accessToken": "<jwt>",
  "user": {
    "id": 12,
    "email": "employee@example.com",
    "role": "EMPLOYEE",
    "employee": {
      "employeeNumber": "EMP-001",
      "fullName": "Example Employee"
    }
  }
}
```

### Employee master data --- HR Admin

  -----------------------------------------------------------------------------------
  Method            Endpoint                  Access            Purpose
  ----------------- ------------------------- ----------------- ---------------------
  POST              `/employees`              HR Admin          Create employee and
                                                                login account

  GET               `/employees`              HR Admin          List employees with
                                                                pagination/search

  GET               `/employees/:id`          HR Admin          Get employee detail

  PATCH             `/employees/:id`          HR Admin          Update employee data

  PATCH             `/employees/:id/status`   HR Admin          Activate/deactivate
                                                                account
  -----------------------------------------------------------------------------------

Example create request:

``` json
{
  "employeeNumber": "EMP-001",
  "fullName": "Example Employee",
  "email": "employee@example.com",
  "department": "Engineering",
  "position": "Software Engineer",
  "phone": "081234567890",
  "temporaryPassword": "ChangeMe123!"
}
```

The backend must hash the temporary password before saving it.

### Attendance --- Employee

  -----------------------------------------------------------------------------
  Method            Endpoint                Access            Purpose
  ----------------- ----------------------- ----------------- -----------------
  POST              `/attendances`          Employee          Submit today's
                                                              WFH attendance
                                                              with photo and
                                                              work description

  GET               `/attendances/me`       Employee          List own
                                                              attendance
                                                              history

  GET               `/attendances/me/:id`   Employee          View own
                                                              attendance detail
  -----------------------------------------------------------------------------

#### Attendance Submission Specification

**Endpoint:** `POST /api/v1/attendances`  
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `photo` | File | Yes | Attendance proof image (JPG, PNG, WebP · Max 5 MB) |
| `workDescription` | String | Yes | Description of work performed that day (cannot be empty) |
| `notes` | String | No | Additional notes (Max 500 characters) |

**Example payload:**
```text
photo: attendance-proof.jpg
workDescription: 
- Developed employee dashboard.
- Fixed authentication middleware.
- Conducted API integration testing.
notes: Completed planned tasks.
```

**Backend processing requirements:**
- **Validate work description**: Ensure `workDescription` is not empty, whitespace-only, or missing.
- **Server-side timestamp**: Capture the current server timestamp (`submitted_at`) and derive `attendance_date` in the configured timezone (`Asia/Jakarta`). Never trust client clock.
- **Employee identification**: Identify the employee via the JWT access token payload; reject untrusted client IDs.
- **MinIO photo upload**: Upload the validated image file directly to MinIO (S3-compatible bucket `wfh-attendance-photos`) with a unique object key.
- **Database persistence**: Save attendance record (including `work_description` and `notes`) and photo metadata to MySQL inside a Prisma transaction.
- **Duplicate prevention**: Prevent duplicate attendance on the same calendar day for an employee; return HTTP `409 Conflict` if already submitted today.

### Attendance monitoring --- HR Admin

  --------------------------------------------------------------------------------------
  Method            Endpoint                         Access            Purpose
  ----------------- -------------------------------- ----------------- -----------------
  GET               `/admin/attendances`             HR Admin          View all
                                                                       attendance
                                                                       records with
                                                                       filters
                                                                       (including work
                                                                       descriptions)

  GET               `/admin/attendances/:id`         HR Admin          View attendance
                                                                       detail (with
                                                                       work description
                                                                       and metadata)

  GET               `/admin/attendances/:id/photo`   HR Admin          View/stream
                                                                       evidence photo
                                                                       from MinIO
  --------------------------------------------------------------------------------------

Suggested query parameters:

``` text
GET /api/v1/admin/attendances?page=1&limit=10&search=alif&department=Engineering&from=2026-11-01&to=2026-11-08
```

Return pagination metadata along with attendance details and `workDescription`:

``` json
{
  "data": [
    {
      "id": 101,
      "employee": {
        "id": 12,
        "employeeNumber": "EMP-001",
        "fullName": "Example Employee",
        "department": "Engineering"
      },
      "attendanceDate": "2026-11-04",
      "submittedAt": "2026-11-04T09:15:30.000Z",
      "workDescription": "- Developed employee dashboard.\n- Fixed authentication middleware.\n- Conducted API integration testing.",
      "notes": "Completed planned tasks.",
      "photo": {
        "id": 85,
        "fileName": "proof-uuid.jpg",
        "mimeType": "image/jpeg",
        "fileSize": 2048576,
        "url": "/api/v1/admin/attendances/101/photo"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

> **HR Monitoring Recommendation:** In the HR monitoring interface and API, always include the `workDescription` as part of the attendance details rather than displaying only the date and photo. This provides essential visibility into daily employee output and makes the monitoring dashboard directly relevant to real WFH oversight requirements.

There must be no attendance update or delete endpoint in this test
implementation because submitted attendance is read-only.

## 7. Core Business Rules

### Login

1.  Find user by normalized email.
2.  Reject unknown users or invalid passwords with a generic
    authentication error.
3.  Reject inactive accounts.
4.  Verify password hash using a secure password-hashing algorithm such
    as Argon2 or bcrypt.
5.  Issue a signed JWT with user ID and role.
6.  Do not include password hashes or sensitive fields in the response.

### Submit WFH attendance

1.  Authenticate the employee using JWT.
2.  Resolve the employee record from the authenticated user ID.
3.  Validate that the employee account is active.
4.  Validate that `workDescription` is present, not empty, and trimmed.
5.  Validate that `photo` is present, within the 5 MB limit, and matches an allowed MIME type (`image/jpeg`, `image/png`, `image/webp`).
6.  Generate the authoritative current timestamp (`submitted_at`) on the backend server.
7.  Calculate `attendance_date` using the configured business timezone (`Asia/Jakarta`).
8.  Check for an existing attendance record for that employee and date (pre-check).
9.  Upload the photo to MinIO S3 bucket (`wfh-attendance-photos`) and receive the object storage key.
10. In a database transaction, persist the attendance record (`employee_id`, `attendance_date`, `submitted_at`, `work_description`, `notes`) and the photo metadata (`attendance_photos`).
11. If a duplicate is submitted concurrently, let the database unique constraint `(employee_id, attendance_date)` reject it and return HTTP `409 Conflict`.
12. If the database transaction fails, clean up the uploaded object from MinIO.
13. Return the saved attendance details.

The unique database constraint is essential; a preliminary
application-level check alone is not enough to prevent race conditions.

### Employee management

-   HR Admin creates the employee account and employee profile.
-   Email and employee number must be unique.
-   Updating employee details must not overwrite attendance history.
-   Deactivating an employee blocks future login and attendance
    submission but preserves historical data.
-   Do not expose password hashes in employee API responses.

### Attendance monitoring

-   HR Admin can filter by date range, employee name/number, and
    department.
-   Employee users can only query their own attendance.
-   HR Admin can view daily work descriptions (`work_description`) and evidence photos through the attendance detail view.
-   Attendance records and evidence cannot be edited or deleted through
    the application.

## 8. Photo Upload and Object Storage (MinIO S3-Compatible)

Attendance photos are stored in **MinIO**, an S3-compatible high-performance object storage service running via Docker Compose (`quay.io/minio/minio:latest`).

### Storage configuration
- **Client library:** Official AWS SDK for JavaScript/TypeScript (`@aws-sdk/client-s3`).
- **Target bucket:** `wfh-attendance-photos` (created during bootstrap or initialized automatically upon service startup).
- **Object naming convention:** `photos/{year}/{month}/{day}/{uuid}-{sanitizedName}.{ext}`.
- **Access control:** Buckets are strictly private. Direct public access is disabled.

### Recommended security and storage controls:

-   **Allowed formats:** Allow only JPEG, PNG, or WebP (`image/jpeg`, `image/png`, `image/webp`).
-   **Size limit:** Maximum upload size enforced at **5 MB**.
-   **Validation:** Validate both MIME type and magic number / file signature where practical; never trust client-provided extension or Content-Type headers alone.
-   **Object keys:** Generate random UUIDs for object keys; never expose server filesystem paths or use user-supplied names directly.
-   **Authenticated retrieval:** Serve photos through an authenticated NestJS proxy endpoint or generate short-lived presigned GET URLs, ensuring that only the owning employee or HR Admin can view the photo.
-   **Atomicity & cleanup:** If the database transaction fails after uploading an object to MinIO, execute a rollback cleanup (`DeleteObjectCommand`) to prevent orphaned storage objects.
-   **Strict rejection of executables:** Explicitly reject scripts, executables, or unknown binary types.

## 9. Frontend Implementation

Use React + TypeScript. A simple structure:

``` text
src/
  app/
    router.tsx
    providers.tsx
  api/
    http.ts
    auth.api.ts
    employees.api.ts
    attendance.api.ts
  components/
    layout/
    forms/
    tables/
    ui/
  features/
    auth/
      LoginPage.tsx
    employee/
      EmployeeDashboard.tsx
      AttendanceForm.tsx
      AttendanceHistory.tsx
    admin/
      EmployeeListPage.tsx
      EmployeeFormPage.tsx
      AttendanceMonitoringPage.tsx
      AttendanceDetailPage.tsx
  hooks/
  types/
  utils/
```

### Pages

#### Shared

-   Login page.
-   Unauthorized / not-found page.
-   Protected application layout with navigation and logout.

#### Employee

-   Dashboard showing today's attendance status.
-   WFH attendance form with daily work description, photo upload/preview, and optional notes.
-   Attendance history table/list (including work descriptions).
-   Attendance detail view.

#### HR Admin

-   Dashboard with basic attendance summary.
-   Employee list with search and pagination.
-   Create employee form.
-   Edit employee form.
-   Attendance monitoring table with date and department filters.
-   Attendance detail view with **Daily Work Description**, submission timestamp, employee profile, and evidence photo.

### Attendance Form UI Design

``` text
┌────────────────────────────────────────────────────────────────────────┐
│ WFH Daily Attendance                                                   │
│ Employee                                                               │
├────────────────────────────────────────────────────────────────────────┤
│ Attendance Date & Time                                                 │
│ Automatically captured by server                                       │
│ Displayed after successful submission                                  │
│                                                                        │
│ Daily Work Description *                                               │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ - Developed employee dashboard.                                    │ │
│ │ - Fixed authentication middleware.                                 │ │
│ │ - Conducted API integration testing.                               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Attendance Photo Evidence *                                            │
│ Upload your work-from-home photo                                       │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Drag and drop your file here, or browse                            │ │
│ │ JPG, PNG, WebP · Maximum 5 MB                                      │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Additional Notes (Optional)                                            │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Completed planned tasks.                                           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ [ Submit Attendance ]                                                  │
│ (UI Preview: Illustrative form layout,                                 │
│  not a functioning attendance submission.)                             │
└────────────────────────────────────────────────────────────────────────┘
```

> **HR Monitoring Enhancement Note:**
> Di halaman monitoring HR, tampilkan **Work Description** sebagai bagian dari detail absensi, bukan hanya tanggal dan foto. Ini akan membuat aplikasi lebih relevan dengan kebutuhan monitoring karyawan WFH, memberikan konteks lengkap atas output kerja harian yang telah diselesaikan.

### Reusable components

-   `AppLayout`
-   `ProtectedRoute`
-   `RoleGuard`
-   `PageHeader`
-   `DataTable`
-   `FormField`
-   `StatusBadge`
-   `FileUpload`
-   `ImagePreview`
-   `Pagination`
-   `LoadingState`
-   `EmptyState`
-   `ErrorMessage`

### Frontend behavior

-   Centralize API calls and attach the JWT consistently.
-   Handle `401 Unauthorized` by clearing the session and redirecting to
    login.
-   Handle `403 Forbidden` with an access-denied state.
-   Display field-level validation messages.
-   Show loading, empty, success, and error states.
-   Prevent repeated form submission while a request is in progress.
-   Preview the selected photo before submission.
-   Display timestamps in the configured local timezone.
-   Do not rely on frontend route guards as the only security control.

For a production deployment, prefer a secure, HTTP-only cookie strategy
with CSRF protection where appropriate. For a self-contained test
implementation, bearer-token handling may be used with care; avoid
long-lived tokens and document the chosen storage strategy.

## 10. Backend Project Structure

``` text
backend/
  src/
    main.ts
    app.module.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
    common/
      decorators/
      guards/
      filters/
      interceptors/
      pipes/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
    users/
      users.module.ts
      users.service.ts
    employees/
      employees.module.ts
      employees.controller.ts
      employees.service.ts
      dto/
    attendance/
      attendance.module.ts
      attendance.controller.ts
      attendance.service.ts
      dto/
    uploads/
      uploads.module.ts
      uploads.service.ts
      storage.interface.ts
  prisma/
    schema.prisma
    migrations/
  test/
```

### Backend conventions

-   Use DTO validation with `class-validator` and `class-transformer`.
-   Enable a global validation pipe with whitelist and rejection of
    unknown properties.
-   Use a global exception filter or consistent exception handling.
-   Use Prisma transactions for operations spanning multiple database
    records.
-   Use guards for JWT authentication and role authorization.
-   Use configuration through environment variables.
-   Keep secrets out of source control.
-   Use structured logging and avoid logging passwords, JWTs, or photo
    contents.

## 11. Security Checklist

-   [ ] Passwords are hashed; plaintext passwords are never stored.
-   [ ] JWT signature and expiry are validated.
-   [ ] Role checks are enforced on backend endpoints.
-   [ ] Employee identity comes from the authenticated token, not
    request body.
-   [ ] Employees cannot access another employee's attendance or photos.
-   [ ] HR Admin cannot modify or delete attendance.
-   [ ] Upload file size, MIME type, and file signature are validated.
-   [ ] Uploads are stored outside the public web root.
-   [ ] DTO validation and unknown-field rejection are enabled.
-   [ ] SQL injection risk is mitigated by Prisma parameterized queries.
-   [ ] CORS is restricted to the frontend origin.
-   [ ] Environment files and secrets are excluded from Git.
-   [ ] Error responses do not expose stack traces or sensitive data.

## 12. Testing Strategy

### Backend unit tests

-   Auth service: valid login, invalid password, inactive account.
-   Employee service: create, update, duplicate email/employee number.
-   Attendance service: successful submission with work description, rejection of empty work description, duplicate same-day submission, inactive employee.
-   Uploads / Storage service: MinIO S3 client upload and retrieval, bucket existence check, rollback cleanup on error.
-   Authorization: employee versus HR Admin permissions.

### Backend integration / API tests

-   Login and retrieve current user.
-   HR Admin creates and updates an employee.
-   Employee submits attendance with a valid photo and mandatory work description.
-   Submission without a work description is rejected (HTTP 400 Bad Request).
-   Submission without a photo is rejected (HTTP 400 Bad Request).
-   Invalid file type and oversized file (> 5 MB) are rejected.
-   Duplicate attendance on the same calendar day returns `409 Conflict`.
-   Photo is verified in MinIO object storage.
-   Employee cannot view another employee's record.
-   Employee cannot access HR endpoints.
-   HR Admin can view attendance records with work descriptions and evidence photos.
-   HR Admin cannot update or delete attendance.

### Frontend checks

-   Login validation and role-based navigation.
-   Attendance form validation (mandatory work description and photo required).
-   Attendance photo selection and preview.
-   Submission success and failure states.
-   Employee history rendering with work description display.
-   HR employee CRUD flow.
-   HR attendance filtering and detail modal with work description and photo preview.
-   Responsive layout for desktop and mobile widths.

## 13. Phase-Based Implementation Plan

The implementation is divided into several development phases based on technical dependencies and functional deliverables rather than fixed daily schedules.

### Phase 1 — Project Foundation & Infrastructure

**Focus:**
- Initialize React.js and NestJS projects.
- Configure MySQL database and Prisma ORM.
- Set up Docker Compose for MySQL and MinIO.
- Configure MinIO bucket for attendance photo storage.
- Design database schema and implement initial migrations.
- Configure environment variables and project structure.

**Deliverables:**
- Running development environment.
- MySQL database with initial schema.
- MinIO object storage successfully configured.
- Backend and frontend project foundations.

### Phase 2 — Authentication & Employee Management

**Focus:**
- Implement JWT-based authentication.
- Implement Role-Based Access Control (RBAC).
- Develop login and authentication APIs.
- Implement employee master data CRUD.
- Develop employee management interfaces for HR Admin.
- Implement account activation and deactivation.

**Deliverables:**
- Working authentication system.
- Employee and HR Admin roles.
- Employee management functionality.
- Protected API endpoints and frontend routes.

### Phase 3 — WFH Attendance & Object Storage Integration

**Focus:**
- Develop WFH attendance submission API.
- Implement server-side date and timestamp generation.
- Implement daily work description input and validation.
- Integrate photo uploads with MinIO using S3-compatible APIs.
- Store attendance records and photo metadata in MySQL.
- Implement duplicate attendance prevention.
- Develop employee attendance form and photo preview.

**Deliverables:**
- Functional WFH attendance submission.
- Mandatory daily work description.
- Successful photo upload to MinIO.
- Attendance records persisted in MySQL.
- Employee attendance submission interface.

### Phase 4 — Attendance Monitoring & Dashboard

**Focus:**
- Develop employee attendance history.
- Develop HR Admin attendance monitoring interface.
- Implement attendance filtering by date, employee, and department.
- Display daily work descriptions and attendance timestamps.
- Implement secure attendance photo viewing.
- Enforce read-only attendance permissions for HR Admin.

**Deliverables:**
- Employee attendance history.
- HR Admin attendance monitoring dashboard.
- Attendance details with work descriptions and photo evidence.
- Secure, role-based attendance access.

### Phase 5 — Testing, Optimization & Documentation

**Focus:**
- Perform backend unit and API integration testing.
- Validate authentication and authorization rules.
- Test photo upload and retrieval through MinIO.
- Test attendance submission and duplicate prevention.
- Validate frontend form handling and error states.
- Improve UI responsiveness and user experience.
- Prepare README, environment examples, and API documentation.
- Perform final end-to-end verification.

**Deliverables:**
- Tested and functional application.
- Verified database and object storage integration.
- API documentation through Swagger.
- Project setup and deployment documentation.
- Final submission-ready application.

### Implementation Priority

The development priority is to ensure that the core employee attendance workflow and HR monitoring workflow are fully functional before implementing optional enhancements.

The system should maintain clear separation between authentication, employee management, attendance processing, and object storage responsibilities.

## 14. Docker Compose & Environment Configuration

### Docker Compose (`docker-compose.yml`)

Add `docker-compose.yml` at the project root to provision MySQL 8.4 and MinIO object storage services:

``` yaml
services:
  mysql:
    image: mysql:8.4
    container_name: wfh-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root_dev_password}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-wfh_attendance}
      MYSQL_USER: ${MYSQL_USER:-app_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-app_dev_password}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  minio:
    image: quay.io/minio/minio:latest
    container_name: wfh-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minio_admin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minio_dev_password}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  mysql_data:
  minio_data:
```

### Environment Configuration (`.env`)

Example backend `.env`:

``` env
# Database Configuration (MySQL via Docker Compose)
DATABASE_URL="mysql://app_user:app_dev_password@localhost:3306/wfh_attendance"

# Object Storage Configuration (MinIO S3-Compatible)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=wfh-attendance-photos
S3_ACCESS_KEY=minio_admin
S3_SECRET_KEY=minio_dev_password
S3_FORCE_PATH_STYLE=true

# Application & Auth Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="1h"
APP_TIMEZONE="Asia/Jakarta"
MAX_UPLOAD_SIZE_MB=5
FRONTEND_ORIGIN="http://localhost:5173"
```

> **Security Note:** Credentials di atas hanya contoh development. Gunakan secret yang kuat dan service account khusus untuk deployment. Jangan pernah commit file `.env` ke version control; sediakan `.env.example` sebagai referensi template.

## 15. Local Development and Run Instructions

Document the exact commands used by the final implementation in the
project README. A typical workflow:

``` bash
# 1. Start Infrastructure (MySQL & MinIO)
docker compose up -d

# 2. Backend Setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# 3. Frontend Setup
cd frontend
npm install
npm run dev
```

Also provide:

-   MinIO setup notes: Access MinIO Console at `http://localhost:9001` (User: `minio_admin`, Password: `minio_dev_password`) and verify that the `wfh-attendance-photos` bucket is created.
-   Database setup instructions.
-   Seed command and sample HR Admin / Employee credentials for
    evaluation.
-   Swagger API documentation URL (e.g. `http://localhost:3000/api/docs`).
-   Build and test commands (`npm test`, `npm run test:e2e`).
-   Any known limitations.

## 16. Definition of Done

### Employee

-   [ ] Employee can log in with an HR-created account.
-   [ ] Employee can see their own dashboard and attendance history.
-   [ ] Employee can submit one WFH attendance record per calendar day.
-   [ ] Submission captures authoritative server date/time.
-   [ ] Daily work description (`work_description`) is mandatory and cannot be empty.
-   [ ] Photo evidence is mandatory, validated (format & max 5 MB), and uploaded to MinIO.
-   [ ] Employee cannot view another employee's records.

### HR Admin

-   [ ] HR Admin can log in.
-   [ ] HR Admin can create and update employee master data.
-   [ ] HR Admin can activate/deactivate employee accounts.
-   [ ] HR Admin can view and filter submitted attendance records.
-   [ ] HR Admin can view daily work descriptions in the monitoring dashboard.
-   [ ] HR Admin can view/stream attendance evidence photos securely.
-   [ ] Attendance is read-only for HR Admin.

### Engineering quality

-   [ ] Docker Compose provisions MySQL 8.4 and MinIO successfully.
-   [ ] Database migrations and seed data are included.
-   [ ] API endpoints are validated and documented with Swagger.
-   [ ] Authentication (JWT) and authorization (RBAC) are enforced by the backend.
-   [ ] Main business rules have automated unit and integration tests.
-   [ ] Frontend and backend run using documented instructions.
-   [ ] No secrets or uploaded files are committed to Git.

## 17. Potential Enhancements (Only After Core Requirements)

-   Attendance dashboard charts and monthly analytics summaries.
-   CSV / Excel export for HR.
-   Geolocation capture with explicit user consent.
-   Configurable work schedules and attendance cut-off rules.
-   Audit log for employee master-data changes.
-   Production cloud migration for object storage (AWS S3, GCS, Cloudflare R2) and CDN acceleration.
-   Refresh-token rotation and session management.

These enhancements should not delay the mandatory employee attendance
and HR monitoring workflows.
