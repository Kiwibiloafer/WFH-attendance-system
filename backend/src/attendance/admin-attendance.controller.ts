import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AttendanceService } from './attendance.service.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Attendance Monitoring (HR Admin)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR_ADMIN')
@Controller('admin/attendances')
export class AdminAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'View all submitted attendance records with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated attendance monitoring records' })
  async findAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAllForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View single attendance detail including daily work description and photo metadata' })
  @ApiResponse({ status: 200, description: 'Attendance detail' })
  @ApiResponse({ status: 404, description: 'Attendance not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOneForAdmin(id);
  }

  @Get(':id/photo')
  @ApiOperation({ summary: 'Stream evidence photo directly from MinIO object storage' })
  @ApiResponse({ status: 200, description: 'Image binary stream' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async streamPhoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    return this.attendanceService.streamPhoto(id, user, res);
  }
}

