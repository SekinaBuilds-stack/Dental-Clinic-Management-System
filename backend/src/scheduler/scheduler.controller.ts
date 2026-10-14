// backend/src/scheduler/scheduler.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/appointments')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('doctor/:id')
  @RequirePermissions('appointments:read')
  getByDoctor(@Param('id') doctorId: string, @Query('date') date?: string) {
    return this.schedulerService.getAppointmentsByDoctor(doctorId, date);
  }

  @Get('chair/:id')
  @RequirePermissions('appointments:read')
  getByChair(@Param('id') chairId: string, @Query('date') date?: string) {
    return this.schedulerService.getAppointmentsByChair(chairId, date);
  }

  @Post()
  @RequirePermissions('appointments:create')
  create(@Body() dto: CreateAppointmentDto) {
    return this.schedulerService.createAppointment(dto);
  }

  @Patch(':id/status')
  @RequirePermissions('appointments:update')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.schedulerService.updateStatus(id, dto);
  }

  @Post('waitlist')
  @RequirePermissions('waitlist:manage')
  addToWaitlist(@Body() dto: CreateWaitlistDto) {
    return this.schedulerService.addToWaitlist(dto);
  }

  @Get('waitlist')
  @RequirePermissions('waitlist:manage')
  getWaitlist() {
    return this.schedulerService.getWaitlist();
  }
}