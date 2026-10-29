// backend/src/emr/emr.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { EmrService } from './emr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('emr')
export class EmrController {
  constructor(private readonly emrService: EmrService) {}

  // TR-EMR-002: Get Odontogram Chart
  @Get('odontogram/:patientId')
  @RequirePermissions('emr:read')
  async getOdontogram(@Param('patientId') patientId: string) {
    return this.emrService.getOdontogramByPatient(patientId);
  }

  // TR-EMR-002: Chart or update tooth conditions (Bulk)
  @Post('odontogram')
  @RequirePermissions('emr:write')
  async upsertOdontogram(
    @Body() dto: { 
      patientId: string; 
      conditions: Array<{ toothNumber: number; condition: string; notes?: string }> 
    }
  ) {
    return this.emrService.upsertOdontogram(dto);
  }

  // TR-EMR-001: Get Treatment Plans
  @Get('treatment-plans/:patientId')
  @RequirePermissions('emr:read')
  async getTreatmentPlans(@Param('patientId') patientId: string) {
    return this.emrService.getTreatmentPlansByPatient(patientId);
  }

  // TR-EMR-001: Create Phased Treatment Plan
  @Post('treatment-plans')
  @RequirePermissions('emr:write')
  async createTreatmentPlan(@Body() dto: any) {
    return this.emrService.createTreatmentPlan(dto);
  }

  // TR-EMR-001: Digital Patient Acceptance
  @Patch('treatment-plans/:id/accept')
  @RequirePermissions('emr:write')
  async acceptTreatmentPlan(@Param('id') id: string) {
    return this.emrService.acceptTreatmentPlan(id);
  }

  // Procedure Catalog
  @Get('procedures/catalog')
  @RequirePermissions('emr:read')
  async getProcedureCatalog() {
    return this.emrService.getProcedureCatalog();
  }
}