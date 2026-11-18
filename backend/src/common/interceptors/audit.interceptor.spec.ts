import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditInterceptor } from './audit.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';

describe('AuditInterceptor (FR-CORE-005)', () => {
  let interceptor: AuditInterceptor;
  let mockAuditRepository: any;

  beforeEach(() => {
    mockAuditRepository = { save: vi.fn().mockResolvedValue({}) };
    interceptor = new AuditInterceptor(mockAuditRepository);
  });

  it('should record audit log on POST/PUT mutation requests', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/v1/patients',
      user: { id: 'usr-001' },
      body: { name: 'Sekina Nesrie' },
    };

    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ id: 'pat-100', name: 'Sekina Nesrie' }),
    };

    await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler));
    await new Promise((r) => setTimeout(r, 0)); // let any async save settle

    expect(mockAuditRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'usr-001', action: 'CREATE' }),
    );
  });
});