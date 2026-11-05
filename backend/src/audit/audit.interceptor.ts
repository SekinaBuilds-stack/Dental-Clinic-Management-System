import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;

    // Only audit mutating state requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let action = AuditAction.UPDATE;
      if (method === 'POST') action = AuditAction.CREATE;
      if (method === 'DELETE') action = AuditAction.DELETE;
      if (url.includes('approve')) action = AuditAction.APPROVAL;
      if (url.includes('reverse')) action = AuditAction.REVERSAL;

      const entityName = url.split('/')[3] || 'UNKNOWN_ENTITY';

      return next.handle().pipe(
        tap((responseData) => {
          this.auditService.log({
            userId: user?.userId || 'SYSTEM',
            userEmail: user?.email || 'system@dcms.local',
            action,
            entityName,
            entityId: responseData?.id || body?.id || null,
            beforeValue: null,
            afterValue: body || responseData,
            ipAddress: ip,
          });
        }),
      );
    }

    return next.handle();
  }
}