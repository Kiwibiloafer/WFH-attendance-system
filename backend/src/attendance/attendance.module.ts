import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller.js';
import { AdminAttendanceController } from './admin-attendance.controller.js';
import { AttendanceService } from './attendance.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [UploadsModule],
  controllers: [AttendanceController, AdminAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
