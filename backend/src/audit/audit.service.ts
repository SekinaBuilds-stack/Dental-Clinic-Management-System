import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>) {
    const entry = this.auditRepo.create(data);
    return this.auditRepo.save(entry);
  }

  async findAll() {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}