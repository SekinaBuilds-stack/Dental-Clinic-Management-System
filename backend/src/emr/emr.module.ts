// backend/src/emr/emr.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmrController } from './emr.controller';
import { EmrService } from './emr.service';
import { Odontogram } from './entities/odontogram.entity';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { TreatmentPlanItem } from './entities/treatment-plan-item.entity';
import { ProcedureCatalog } from './entities/procedure-catalog.entity';
import { ProcedurePrice } from './entities/procedure-price.entity';
import { ClinicalNote } from './entities/clinical-note.entity';
import { Prescription } from './entities/prescription.entity';
import { LabOrder } from './entities/lab-order.entity';
import { ImagingFile } from './entities/imaging-file.entity';
import { Consent } from './entities/consent.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Odontogram,
      TreatmentPlan,
      TreatmentPlanItem,
      ProcedureCatalog,
      ProcedurePrice,
      // FR-EMR-003 to FR-EMR-008: tables the service reaches by name
      ClinicalNote,
      Prescription,
      LabOrder,
      ImagingFile,
      Consent,
    ]),
    StorageModule,
  ],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService],
})
export class EmrModule {}
