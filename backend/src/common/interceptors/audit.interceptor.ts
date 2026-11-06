import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from '../../../src/audit/entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // Only audit mutations (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async (response) => {
          try {
            await this.auditRepository.save({
              userId: user?.id || 'system',
              action: method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE',
              entity: url,
              details: JSON.stringify({ body, responseSummary: response?.id || 'success' }),
              timestamp: new Date(),
            } as any); // Cast as any to resolve TypeORM save entity mismatch
          } catch (err) {
            console.error('Failed to save audit log:', err);
          }
        }),
      );
    }

    return next.handle();
  }
}