import { describe, beforeEach, it, expect, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaMock: any;
  let jwtServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    jwtServiceMock = {
      signAsync: vi.fn().mockResolvedValue('test-jwt-token'),
    };
    authService = new AuthService(prismaMock, jwtServiceMock);
  });

  it('should successfully authenticate active user with valid password', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'hr@dexa.com',
      passwordHash,
      isActive: true,
      role: { name: 'HR_ADMIN' },
      employee: null,
    });
    prismaMock.user.update.mockResolvedValue({});

    const result = await authService.login({
      email: 'hr@dexa.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('test-jwt-token');
    expect(result.user.email).toBe('hr@dexa.com');
    expect(result.user.role).toBe('HR_ADMIN');
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'hr@dexa.com',
      passwordHash,
      isActive: true,
      role: { name: 'HR_ADMIN' },
    });

    await expect(
      authService.login({
        email: 'hr@dexa.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when account is deactivated', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'hr@dexa.com',
      passwordHash,
      isActive: false, // Inactive account
      role: { name: 'HR_ADMIN' },
    });

    await expect(
      authService.login({
        email: 'hr@dexa.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

