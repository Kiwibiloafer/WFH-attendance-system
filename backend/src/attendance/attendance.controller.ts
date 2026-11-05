import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AttendanceService } from './attendance.service.js';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { UploadableFile } from '../uploads/storage.interface.js';

@ApiTags('Attendance (Employee)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendances')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles('EMPLOYEE')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit daily WFH attendance with photo evidence and work description' })
  @ApiResponse({ status: 201, description: 'Attendance submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing photo, invalid format, or empty work description' })
  @ApiResponse({ status: 409, description: 'Duplicate attendance for today' })
  async submitAttendance(
    @CurrentUser('employeeId') employeeId: number,
    @Body() dto: SubmitAttendanceDto,
    @UploadedFile() file: UploadableFile,
  ) {
    return this.attendanceService.submitAttendance(employeeId, dto, file);
  }

  @Get('today')
  @Roles('EMPLOYEE')
  @ApiOperation({ summary: "Get current employee's attendance status for today" })
  @ApiResponse({ status: 200, description: "Today's attendance status" })
  async getTodayStatus(@CurrentUser('employeeId') employeeId: number) {
    return this.attendanceService.getTodayStatus(employeeId);
  }

  @Get('me')
  @Roles('EMPLOYEE')
  @ApiOperation({ summary: 'Get current employee attendance history' })
  @ApiResponse({ status: 200, description: 'Paginated attendance history' })
  async findMyAttendances(
    @CurrentUser('employeeId') employeeId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.attendanceService.findMyAttendances(employeeId, page, limit);
  }

  @Get('me/:id')
  @Roles('EMPLOYEE')
  @ApiOperation({ summary: 'Get detail of own attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance record detail' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Attendance not found' })
  async findMyAttendanceDetail(
    @CurrentUser('employeeId') employeeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.attendanceService.findOne(id, employeeId);
  }

  @Get(':id/photo')
  @ApiOperation({ summary: 'Stream attendance evidence photo securely from MinIO' })
  @ApiResponse({ status: 200, description: 'Image binary stream' })
  @ApiResponse({ status: 403, description: 'Forbidden if not the owner or HR Admin' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async streamPhoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    return this.attendanceService.streamPhoto(id, user, res);
  }
}
