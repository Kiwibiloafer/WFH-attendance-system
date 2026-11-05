import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Phase 3: WFH Attendance & MinIO Integration E2E Tests', () => {
  let app: INestApplication;
  let empToken: string;
  let hrToken: string;
  let submittedAttendanceId: number;

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

    // Create a fresh test employee for this E2E run
    const timestamp = Date.now();
    const testEmail = `tester.${timestamp}@dexa.com`;
    const testEmpNumber = `EMP-TEST-${timestamp}`;

    await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeNumber: testEmpNumber,
        fullName: `E2E Tester ${timestamp}`,
        email: testEmail,
        department: 'Quality Assurance',
        temporaryPassword: 'Password123!',
      })
      .expect(201);

    // Authenticate the fresh test employee
    const empLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      })
      .expect(200);
    empToken = empLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Validation & Permissions', () => {
    it('HR Admin cannot submit attendance (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${hrToken}`)
        .field('workDescription', 'HR work')
        .attach('photo', Buffer.from('fake-img'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });

    it('Employee submit without photo is rejected (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${empToken}`)
        .field('workDescription', 'Only description without photo')
        .expect(400);

      expect(res.body.message).toContain('Foto bukti kehadiran wajib diunggah');
    });

    it('Employee submit without workDescription is rejected (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${empToken}`)
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(JSON.stringify(res.body.message)).toContain('Deskripsi pekerjaan');
    });

    it('Employee submit with invalid file format is rejected (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${empToken}`)
        .field('workDescription', 'Valid description')
        .attach('photo', Buffer.from('fake-pdf-content'), {
          filename: 'document.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);

      expect(res.body.message).toContain('Format file tidak didukung');
    });
  });

  describe('Successful Attendance Submission & MinIO Persistence', () => {
    it('POST /attendances - Employee submits valid attendance with photo', async () => {
      const fakeJpgBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${empToken}`)
        .field(
          'workDescription',
          '- Built MinIO S3 object storage integration.\n- Implemented duplicate prevention logic.\n- Wrote E2E automated integration tests.',
        )
        .field('notes', 'Completed sprint 1 deliverables.')
        .attach('photo', fakeJpgBuffer, {
          filename: 'wfh-evidence.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.attendanceDate).toBeDefined();
      expect(res.body.submittedAt).toBeDefined();
      expect(res.body.workDescription).toContain('Built MinIO S3 object storage');
      expect(res.body.notes).toBe('Completed sprint 1 deliverables.');
      expect(res.body.photo).toBeDefined();
      expect(res.body.photo.fileName).toBeDefined();
      expect(res.body.photo.mimeType).toBe('image/jpeg');

      submittedAttendanceId = res.body.id;
    });

    it('Duplicate submission on the same calendar day returns 409 Conflict', async () => {
      const fakeJpgBuffer = Buffer.from('dummy-image-bytes');

      const res = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${empToken}`)
        .field('workDescription', 'Trying to submit a second attendance today')
        .attach('photo', fakeJpgBuffer, {
          filename: 'wfh-evidence-2.jpg',
          contentType: 'image/jpeg',
        })
        .expect(409);

      expect(res.body.message).toContain('sudah melakukan absensi');
    });

    it('GET /attendances/today - shows submitted status for today', async () => {
      const res = await request(app.getHttpServer())
        .get('/attendances/today')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(200);

      expect(res.body.submitted).toBe(true);
      expect(res.body.attendance.id).toBe(submittedAttendanceId);
    });

    it('GET /attendances/me - retrieves employee attendance history', async () => {
      const res = await request(app.getHttpServer())
        .get('/attendances/me')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(submittedAttendanceId);
    });

    it('GET /attendances/:id/photo - streams evidence photo from MinIO', async () => {
      const res = await request(app.getHttpServer())
        .get(`/attendances/${submittedAttendanceId}/photo`)
        .set('Authorization', `Bearer ${empToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('image/jpeg');
    });

    it('GET /attendances/:id/photo - HR Admin can also view/stream evidence photo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/attendances/${submittedAttendanceId}/photo`)
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('image/jpeg');
    });
  });
});
