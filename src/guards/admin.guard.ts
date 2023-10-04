import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request?.currentUser.userRole !== "Admin") {
      throw new ForbiddenException();
    }
    return request.headers.authorization;
  }
}
