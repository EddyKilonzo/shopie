import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'generated/prisma';

interface UserWithRole {
  role: Role;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  /**
   * This guard is used to protect the routes from unauthorized users
   * @param context - The execution context
   * @returns true if the user has the required role, false otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: UserWithRole } = context
      .switchToHttp()
      .getRequest();
    return user && requiredRoles.some((role) => user.role === role);
  }
}
