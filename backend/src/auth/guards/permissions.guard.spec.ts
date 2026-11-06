import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard (FR-CORE-002)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access if no permissions are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(null);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access if user lacks required permission', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['clinical:write']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions: ['clinical:read'] },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});