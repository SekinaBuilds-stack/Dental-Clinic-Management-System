import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('reports:view')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('collections')
  getCollections(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getDailyCollections(startDate || '2026-01-01', endDate || '2026-12-31');
  }

  @Get('doctor-production')
  getDoctorProduction(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getDoctorProduction(startDate || '2026-01-01', endDate || '2026-12-31');
  }

  @Get('treatment-analysis')
  getTreatmentAnalysis() {
    return this.reportsService.getTreatmentAnalysis();
  }

  @Get('receivables-aging')
  getReceivablesAging() {
    return this.reportsService.getReceivablesAging();
  }
}
