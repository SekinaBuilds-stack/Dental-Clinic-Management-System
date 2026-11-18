import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

function makeContext(user?: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard (FR-CORE-002)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access if no permissions are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('should allow access if the user has all required permissions', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patients:read']);
    expect(guard.canActivate(makeContext({ permissions: ['patients:read', 'patients:create'] }))).toBe(true);
  });

  it('should deny access if user lacks a required permission', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['clinical:write']);
    expect(() => guard.canActivate(makeContext({ permissions: ['clinical:read'] }))).toThrow(ForbiddenException);
  });

  it('should deny access if the user has no permissions list', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patients:read']);
    expect(() => guard.canActivate(makeContext({ email: 'x@y.z' }))).toThrow(ForbiddenException);
  });
});