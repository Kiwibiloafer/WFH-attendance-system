import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UploadableFile } from '../uploads/storage.interface.js';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly timezone: string;
  private readonly maxFileSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
  ) {
    this.timezone = this.configService.get<string>('APP_TIMEZONE', 'Asia/Jakarta');
    const maxMb = Number(this.configService.get<string>('MAX_UPLOAD_SIZE_MB', '5'));
    this.maxFileSize = maxMb * 1024 * 1024;
  }

  getTodayDate(): Date {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(new Date()); // Returns "YYYY-MM-DD"
    return new Date(`${dateStr}T00:00:00.000Z`);
  }

  async submitAttendance(
    employeeId: number,
    dto: SubmitAttendanceDto,
    file?: UploadableFile,
  ) {
    if (!employeeId) {
      throw new ForbiddenException('User is not associated with an employee profile');
    }

    // 1. Verify active employee account
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    if (!employee.user.isActive) {
      throw new ForbiddenException('Employee account is inactive');
    }

    // 2. Validate work description
    if (!dto.workDescription || dto.workDescription.trim().length === 0) {
      throw new BadRequestException('Deskripsi pekerjaan (work description) wajib diisi');
    }

    // 3. Validate photo file
    if (!file) {
      throw new BadRequestException('Foto bukti kehadiran wajib diunggah');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format file tidak didukung (${file.mimetype}). Hanya format JPG, PNG, dan WebP yang diizinkan.`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Ukuran file melebihi batas maksimum (${(this.maxFileSize / (1024 * 1024)).toFixed(0)} MB).`,
      );
    }

    // 4. Server-authoritative timestamp & business date
    const submittedAt = new Date();
    const attendanceDate = this.getTodayDate();

    // 5. Pre-check duplicate submission for today
    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Anda sudah melakukan absensi untuk hari ini. Setiap karyawan hanya dapat absen 1 kali per hari kalender.',
      );
    }

    // 6. Upload photo to MinIO object storage
    const storedPhoto = await this.uploadsService.uploadPhoto(file);

    // 7. Persist to MySQL in a Prisma transaction
    try {
      const attendance = await this.prisma.$transaction(async (tx) => {
        const record = await tx.attendance.create({
          data: {
            employeeId,
            attendanceDate,
            submittedAt,
            workDescription: dto.workDescription.trim(),
            notes: dto.notes?.trim() || null,
          },
        });

        await tx.attendancePhoto.create({
          data: {
            attendanceId: record.id,
            fileName: storedPhoto.fileName,
            originalName: storedPhoto.originalName,
            mimeType: storedPhoto.mimeType,
            fileSize: storedPhoto.fileSize,
            storagePath: storedPhoto.storagePath,
          },
        });

        return record;
      });

      return this.findOne(attendance.id, employeeId);
    } catch (dbError: any) {
      // Rollback MinIO upload on database failure
      this.logger.error('Failed to persist attendance record. Rolling back MinIO object...', dbError);
      await this.uploadsService.deletePhoto(storedPhoto.storagePath);

      if (dbError.code === 'P2002') {
        throw new ConflictException(
          'Anda sudah melakukan absensi untuk hari ini (duplicate submission rejected).',
        );
      }
      throw dbError;
    }
  }

  async getTodayStatus(employeeId: number) {
    const attendanceDate = this.getTodayDate();

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
        },
      },
      include: {
        photo: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    return {
      submitted: !!attendance,
      attendanceDate: attendanceDate.toISOString().split('T')[0],
      attendance: attendance
        ? {
            ...attendance,
            photo: attendance.photo
              ? {
                  ...attendance.photo,
                  url: `/api/v1/attendances/${attendance.id}/photo`,
                }
              : null,
          }
        : null,
    };
  }

  async findMyAttendances(employeeId: number, page = 1, limit = 10) {
    const validPage = Math.max(1, Number(page) || 1);
    const validLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (validPage - 1) * validLimit;

    const where = { employeeId };

    const [total, records] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { attendanceDate: 'desc' },
        include: {
          photo: true,
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              fullName: true,
              department: true,
              position: true,
            },
          },
        },
      }),
    ]);

    const formattedData = records.map((rec) => ({
      ...rec,
      photo: rec.photo
        ? {
            ...rec.photo,
            url: `/api/v1/attendances/${rec.id}/photo`,
          }
        : null,
    }));

    return {
      data: formattedData,
      meta: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit) || 1,
      },
    };
  }

  async findOne(id: number, employeeId?: number) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
        photo: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    if (employeeId && attendance.employeeId !== employeeId) {
      throw new ForbiddenException('Access denied: You can only view your own attendance records');
    }

    return {
      ...attendance,
      photo: attendance.photo
        ? {
            ...attendance.photo,
            url: `/api/v1/attendances/${attendance.id}/photo`,
          }
        : null,
    };
  }

  async findAllForAdmin(query: QueryAttendanceDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.department) {
      where.employee = { ...where.employee, department: query.department };
    }

    if (query.search) {
      const search = query.search.trim();
      where.employee = {
        ...where.employee,
        OR: [
          { fullName: { contains: search } },
          { employeeNumber: { contains: search } },
        ],
      };
    }

    if (query.from || query.to) {
      where.attendanceDate = {};
      if (query.from) {
        where.attendanceDate.gte = new Date(`${query.from}T00:00:00.000Z`);
      }
      if (query.to) {
        where.attendanceDate.lte = new Date(`${query.to}T23:59:59.999Z`);
      }
    }

    const [total, records] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          photo: true,
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              fullName: true,
              department: true,
              position: true,
            },
          },
        },
      }),
    ]);

    const formattedData = records.map((rec) => ({
      ...rec,
      photo: rec.photo
        ? {
            ...rec.photo,
            url: `/api/v1/attendances/${rec.id}/photo`,
          }
        : null,
    }));

    return {
      data: formattedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOneForAdmin(id: number) {
    return this.findOne(id);
  }

  async streamPhoto(attendanceId: number, user: any, res: Response) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { photo: true },
    });

    if (!attendance || !attendance.photo) {
      throw new NotFoundException('Foto bukti kehadiran tidak ditemukan');
    }

    // Role check: HR_ADMIN can access all, EMPLOYEE can only access their own
    if (user.role !== 'HR_ADMIN' && attendance.employeeId !== user.employeeId) {
      throw new ForbiddenException('Access denied: Anda tidak memiliki akses ke foto ini');
    }

    const { stream, contentType, contentLength } = await this.uploadsService.getPhotoStream(
      attendance.photo.storagePath,
    );

    res.set({
      'Content-Type': contentType,
      ...(contentLength ? { 'Content-Length': contentLength.toString() } : {}),
      'Cache-Control': 'private, max-age=86400',
    });

    (stream as any).pipe(res);
  }
}
