import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request?.currentUser.userRole !== "User") {
      throw new ForbiddenException();
    }
    return request.headers.authorization;
  }
}
