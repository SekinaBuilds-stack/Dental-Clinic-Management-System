// backend/src/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService], // Must export StorageService so other modules can use it!
})
export class StorageModule {}