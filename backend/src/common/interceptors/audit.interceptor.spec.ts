import { AuditInterceptor } from './audit.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('AuditInterceptor (FR-CORE-005)', () => {
  let interceptor: AuditInterceptor;
  let mockAuditRepository: any;

  beforeEach(() => {
    mockAuditRepository = { save: jest.fn().mockResolvedValue({}) };
    interceptor = new AuditInterceptor(mockAuditRepository);
  });

  it('should record audit log on POST/PUT mutation requests', (done) => {
    const mockRequest = {
      method: 'POST',
      url: '/api/v1/patients',
      user: { id: 'usr-001' },
      body: { name: 'Sekina Nesrie' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ id: 'pat-100', name: 'Sekina Nesrie' }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockAuditRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'usr-001',
            action: 'CREATE',
            entity: '/api/v1/patients',
          }),
        );
        done();
      },
    });
  });
});