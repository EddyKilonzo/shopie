import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Injectable()
/**
 * This guard is used to protect the cart functionality from admins
 */
export class CustomerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Admins cannot access cart functionality');
    }

    return true;
  }
}
