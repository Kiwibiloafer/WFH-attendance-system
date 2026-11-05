import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Phase 4: Attendance Monitoring & Dashboard E2E Tests', () => {
  let app: INestApplication;
  let hrToken: string;
  let empToken: string;
  let sampleAttendanceId: number;

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

    // Authenticate HR
    const hrLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hr@dexa.com',
        password: 'Password123!',
      })
      .expect(200);
    hrToken = hrLogin.body.accessToken;

    // Authenticate Employee
    const empLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'siti@dexa.com',
        password: 'Password123!',
      })
      .expect(200);
    empToken = empLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('HR Monitoring Access & RBAC', () => {
    it('GET /admin/attendances - Employee is rejected with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/admin/attendances')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(403);
    });

    it('GET /admin/attendances - HR Admin can view all attendance records', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/attendances?limit=10')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();

      if (res.body.data.length > 0) {
        sampleAttendanceId = res.body.data[0].id;
        const first = res.body.data[0];
        expect(first.workDescription).toBeDefined();
        expect(first.employee).toBeDefined();
        expect(first.employee.fullName).toBeDefined();
        expect(first.employee.department).toBeDefined();
      }
    });

    it('GET /admin/attendances with filters (department, search)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/attendances?department=Product Management&search=Siti')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      res.body.data.forEach((rec: any) => {
        expect(rec.employee.department).toBe('Product Management');
      });
    });

    it('GET /admin/attendances/:id - HR Admin can view single attendance detail', async () => {
      if (!sampleAttendanceId) return;

      const res = await request(app.getHttpServer())
        .get(`/admin/attendances/${sampleAttendanceId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(res.body.id).toBe(sampleAttendanceId);
      expect(res.body.workDescription).toBeDefined();
      expect(res.body.employee).toBeDefined();
    });

    it('Strict Read-Only Enforcement - Attendance modification endpoints do not exist (404 Not Found)', async () => {
      // PUT
      await request(app.getHttpServer())
        .put('/admin/attendances/1')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ workDescription: 'Hacked' })
        .expect(404);

      // PATCH
      await request(app.getHttpServer())
        .patch('/admin/attendances/1')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ workDescription: 'Hacked' })
        .expect(404);

      // DELETE
      await request(app.getHttpServer())
        .delete('/admin/attendances/1')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(404);
    });
  });
});

