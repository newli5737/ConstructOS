import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    if (user.roles?.includes('ADMIN')) {
      return true;
    }

    if (requiredRoles && !requiredRoles.some((role) => user.roles?.includes(role))) {
      throw new ForbiddenException('Bạn không có vai trò phù hợp để thực hiện thao tác này');
    }

    if (
      requiredPermissions &&
      !requiredPermissions.some((perm) => user.permissions?.includes(perm))
    ) {
      throw new ForbiddenException('Bạn không có quyền hạn cần thiết');
    }

    return true;
  }
}
