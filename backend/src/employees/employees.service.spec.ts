import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service.js';

describe('EmployeesService', () => {
  let employeesService: EmployeesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      employee: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    employeesService = new EmployeesService(prismaMock);
  });

  it('should reject creation if email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'budi@dexa.com' });

    await expect(
      employeesService.create({
        employeeNumber: 'EMP-999',
        fullName: 'Budi Test',
        email: 'budi@dexa.com',
        department: 'Engineering',
        temporaryPassword: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject creation if employee number already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.employee.findUnique.mockResolvedValue({ id: 2, employeeNumber: 'EMP-001' });

    await expect(
      employeesService.create({
        employeeNumber: 'EMP-001',
        fullName: 'Budi Test',
        email: 'unique@dexa.com',
        department: 'Engineering',
        temporaryPassword: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException if employee not found by id', async () => {
    prismaMock.employee.findUnique.mockResolvedValue(null);

    await expect(employeesService.findOne(999)).rejects.toThrow(NotFoundException);
  });
});

