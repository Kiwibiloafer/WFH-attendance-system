import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Phase 2: Auth & Employees E2E Tests', () => {
  let app: INestApplication;
  let hrToken: string;
  let empToken: string;
  let createdEmpId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('POST /auth/login - should fail with invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'hr@dexa.com',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(res.body.message).toContain('Invalid email or password');
    });

    it('POST /auth/login - should authenticate HR Admin and return JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'hr@dexa.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('HR_ADMIN');
      hrToken = res.body.accessToken;
    });

    it('POST /auth/login - should authenticate Employee and return JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'employee@dexa.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('EMPLOYEE');
      expect(res.body.user.employee.employeeNumber).toBe('EMP-001');
      empToken = res.body.accessToken;
    });

    it('GET /auth/me - should return authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(res.body.email).toBe('hr@dexa.com');
      expect(res.body.role).toBe('HR_ADMIN');
    });
  });

  describe('Employee Management & RBAC', () => {
    const testEmployeeNumber = `EMP-TEST-${Date.now()}`;
    const testEmail = `test.${Date.now()}@dexa.com`;

    it('POST /employees - HR Admin can create an employee', async () => {
      const res = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeNumber: testEmployeeNumber,
          fullName: 'Test Developer',
          email: testEmail,
          department: 'Engineering',
          position: 'Backend Developer',
          phone: '081299998888',
          temporaryPassword: 'Password123!',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.employeeNumber).toBe(testEmployeeNumber);
      expect(res.body.user.email).toBe(testEmail);
      createdEmpId = res.body.id;
    });

    it('POST /employees - should reject duplicate email or employee number with 409', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeNumber: testEmployeeNumber,
          fullName: 'Duplicate Tester',
          email: 'another.unique@dexa.com',
          department: 'Engineering',
          temporaryPassword: 'Password123!',
        })
        .expect(409);
    });

    it('GET /employees - HR Admin can list employees', async () => {
      const res = await request(app.getHttpServer())
        .get('/employees?limit=5')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /employees - Employee should be rejected with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(403);
    });

    it('PATCH /employees/:id/status - HR Admin can toggle employee active status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/employees/${createdEmpId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.user.isActive).toBe(false);
    });

    it('POST /auth/login - Deactivated employee should be rejected with 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        })
        .expect(401);
    });
  });
});

