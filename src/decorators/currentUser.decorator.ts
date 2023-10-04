import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { CurrentUserDto } from "../dtos/currentUser.dto";

export const CurrentUser = createParamDecorator((data: never, context: ExecutionContext): CurrentUserDto => {
  const request = context.switchToHttp().getRequest();
  return request.currentUser;
});
