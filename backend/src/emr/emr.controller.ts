// backend/src/emr/emr.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmrService } from './emr.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('emr')
export class EmrController {
  constructor(
    private readonly emrService: EmrService,
    private readonly storageService: StorageService,
  ) {}

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

  // TR-EMR-003: Clinical Progress Notes
  @Post('clinical-notes')
  @RequirePermissions('emr:write')
  async createClinicalNote(
    @Body() dto: { patientId: string; visitId?: string; toothNumber?: number; notes: string; diagnosis: string }
  ) {
    return (this.emrService as any).createClinicalNote(dto);
  }

  @Get('clinical-notes/:patientId')
  @RequirePermissions('emr:read')
  async getClinicalNotes(@Param('patientId') patientId: string) {
    return (this.emrService as any).getClinicalNotesByPatient(patientId);
  }

  // TR-EMR-004: Prescriptions
  @Post('prescriptions')
  @RequirePermissions('emr:write')
  async createPrescription(
    @Body() dto: { 
      patientId: string; 
      prescriberId: string; 
      items: Array<{ drugName: string; dosage: string; frequency: string; duration: string }> 
    }
  ) {
    return (this.emrService as any).createPrescription(dto);
  }

  // TR-EMR-005 & TR-EMR-006: Lab Work Orders & Status
  @Post('lab-orders')
  @RequirePermissions('lab:manage')
  async createLabOrder(
    @Body() dto: { patientId: string; labName: string; specifications: string; cost: number; toothNumber?: number }
  ) {
    return (this.emrService as any).createLabOrder(dto);
  }

  @Patch('lab-orders/:id/status')
  @RequirePermissions('lab:manage')
  async updateLabOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return (this.emrService as any).updateLabOrderStatus(id, status);
  }

  // TR-EMR-007: Imaging Attachments (MinIO S3 Integration)
  @Post('imaging')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('emr:write')
  async uploadImaging(
    @UploadedFile() file: any,
    @Body('patientId') patientId: string,
    @Body('toothNumber') toothNumber?: number,
    @Body('imagingType') imagingType?: string,
  ) {
    const { fileUrl, fileName } = await this.storageService.uploadFile(file, 'imaging');
    return (this.emrService as any).saveImagingRecord({ patientId, fileUrl, fileName, toothNumber, imagingType });
  }

  // TR-EMR-008: Digital Consent
  @Post('consents')
  @RequirePermissions('emr:write')
  async saveConsent(
    @Body() dto: { patientId: string; procedureName: string; signatureData: string; signedBy: string }
  ) {
    return (this.emrService as any).saveConsent(dto);
  }

  // Procedure Catalog
  @Get('procedures/catalog')
  @RequirePermissions('emr:read')
  async getProcedureCatalog() {
    return this.emrService.getProcedureCatalog();
  }
}