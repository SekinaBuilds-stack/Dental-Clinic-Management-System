// backend/src/auth/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required for this route
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.permissions) {
      throw new ForbiddenException('Access denied: Insufficient permissions.');
    }

    const hasAllPermissions = requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Access denied: You do not possess the required clinical or administrative permissions.');
    }

    return true;
  }
}