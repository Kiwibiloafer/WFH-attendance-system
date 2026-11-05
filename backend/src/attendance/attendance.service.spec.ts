import { describe, beforeEach, it, expect, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';

describe('AttendanceService', () => {
  let attendanceService: AttendanceService;
  let prismaMock: any;
  let uploadsServiceMock: any;
  let configServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      employee: {
        findUnique: vi.fn(),
      },
      attendance: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      attendancePhoto: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    uploadsServiceMock = {
      uploadPhoto: vi.fn(),
      deletePhoto: vi.fn(),
      getPhotoStream: vi.fn(),
    };

    configServiceMock = {
      get: vi.fn((key, def) => def),
    };

    attendanceService = new AttendanceService(
      prismaMock,
      uploadsServiceMock,
      configServiceMock,
    );
  });

  const dummyValidFile: any = {
    fieldname: 'photo',
    originalname: 'proof.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 500, // 500 KB
    buffer: Buffer.from('fake-image-bytes'),
  };

  it('should throw ForbiddenException if employee profile does not exist or user is not an employee', async () => {
    await expect(
      attendanceService.submitAttendance(
        0,
        { workDescription: 'Done tasks' },
        dummyValidFile,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if work description is missing or empty', async () => {
    prismaMock.employee.findUnique.mockResolvedValue({
      id: 1,
      user: { isActive: true },
    });

    await expect(
      attendanceService.submitAttendance(
        1,
        { workDescription: '   ' },
        dummyValidFile,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if photo file is missing', async () => {
    prismaMock.employee.findUnique.mockResolvedValue({
      id: 1,
      user: { isActive: true },
    });

    await expect(
      attendanceService.submitAttendance(
        1,
        { workDescription: 'My work description' },
        undefined,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if photo format is invalid', async () => {
    prismaMock.employee.findUnique.mockResolvedValue({
      id: 1,
      user: { isActive: true },
    });

    const invalidFile: any = {
      ...dummyValidFile,
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
    };

    await expect(
      attendanceService.submitAttendance(
        1,
        { workDescription: 'My work description' },
        invalidFile,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if photo exceeds 5 MB size limit', async () => {
    prismaMock.employee.findUnique.mockResolvedValue({
      id: 1,
      user: { isActive: true },
    });

    const oversizedFile: any = {
      ...dummyValidFile,
      size: 6 * 1024 * 1024, // 6 MB
    };

    await expect(
      attendanceService.submitAttendance(
        1,
        { workDescription: 'My work description' },
        oversizedFile,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException if attendance already submitted today', async () => {
    prismaMock.employee.findUnique.mockResolvedValue({
      id: 1,
      user: { isActive: true },
    });
    // Existing record found for today
    prismaMock.attendance.findUnique.mockResolvedValue({ id: 10 });

    await expect(
      attendanceService.submitAttendance(
        1,
        { workDescription: 'My work description' },
        dummyValidFile,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should rollback uploaded MinIO photo if database transaction fails', async () => {
    prismaMock.employee.findUnique.mockResolvedValue({
      id: 1,
      user: { isActive: true },
    });
    prismaMock.attendance.findUnique.mockResolvedValue(null);

    uploadsServiceMock.uploadPhoto.mockResolvedValue({
      storagePath: 'photos/2026/11/04/test-uuid.jpg',
      fileName: 'test-uuid.jpg',
      originalName: 'proof.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024 * 500,
    });

    prismaMock.$transaction.mockRejectedValue(new Error('DB Connection Timeout'));

    await expect(
      attendanceService.submitAttendance(
        1,
        { workDescription: 'My work description' },
        dummyValidFile,
      ),
    ).rejects.toThrow('DB Connection Timeout');

    // Verify rollback cleanup was executed!
    expect(uploadsServiceMock.deletePhoto).toHaveBeenCalledWith(
      'photos/2026/11/04/test-uuid.jpg',
    );
  });

  describe('HR Monitoring Queries', () => {
    it('findAllForAdmin should return filtered and formatted attendance records', async () => {
      prismaMock.attendance.count.mockResolvedValue(1);
      prismaMock.attendance.findMany.mockResolvedValue([
        {
          id: 101,
          attendanceDate: new Date('2026-11-05T00:00:00.000Z'),
          submittedAt: new Date('2026-11-05T09:00:00.000Z'),
          workDescription: '- Task completed',
          notes: 'All good',
          employee: {
            id: 1,
            employeeNumber: 'EMP-001',
            fullName: 'Budi Pratama',
            department: 'Engineering',
            position: 'Software Engineer',
          },
          photo: {
            id: 88,
            fileName: 'uuid.jpg',
            storagePath: 'photos/2026/11/05/uuid.jpg',
          },
        },
      ]);

      const result = await attendanceService.findAllForAdmin({
        page: 1,
        limit: 10,
        department: 'Engineering',
        search: 'Budi',
        from: '2026-11-01',
        to: '2026-11-30',
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].photo?.url).toBe('/api/v1/attendances/101/photo');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });
});

