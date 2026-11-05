import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { QueryEmployeeDto } from './dto/query-employee.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const email = dto.email.trim().toLowerCase();
    const employeeNumber = dto.employeeNumber.trim();

    // 1. Check duplicate email
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(`Email '${email}' is already registered`);
    }

    // 2. Check duplicate employee number
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { employeeNumber },
    });
    if (existingEmployee) {
      throw new ConflictException(`Employee number '${employeeNumber}' is already registered`);
    }

    // 3. Resolve EMPLOYEE role
    const employeeRole = await this.prisma.role.findUnique({
      where: { name: 'EMPLOYEE' },
    });
    if (!employeeRole) {
      throw new NotFoundException('Role EMPLOYEE not found in system');
    }

    // 4. Hash temporary password
    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 10);

    // 5. Create user and employee profile inside a Prisma transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          roleId: employeeRole.id,
          isActive: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeNumber,
          fullName: dto.fullName.trim(),
          department: dto.department.trim(),
          position: dto.position?.trim() || null,
          phone: dto.phone?.trim() || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
        },
      });

      return employee;
    });

    return result;
  }

  async findAll(query: QueryEmployeeDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.department) {
      where.department = query.department;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search } },
        { employeeNumber: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName.trim();
    if (dto.department !== undefined) updateData.department = dto.department.trim();
    if (dto.position !== undefined) updateData.position = dto.position?.trim() || null;
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim() || null;

    const updated = await this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    return updated;
  }

  async updateStatus(id: number, isActive: boolean) {
    const employee = await this.findOne(id);

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { isActive },
    });

    return this.findOne(id);
  }
}

