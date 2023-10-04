import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Request, Response, NextFunction } from 'express';
import configuration from 'src/config/configuration';
import { UsersService } from 'src/service/user.service';
import { CurrentUserDto } from 'src/dtos/currentUser.dto';

declare global {
  namespace Express {
    export interface Request {
      currentUser?: CurrentUserDto;
    }
  }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {

  constructor(
    private userService: UsersService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const idToken = (req.headers.authorization || "").split(" ")[1];
      if (!idToken) {
        return next();
      }
      req.currentUser = null;
      const verifiedCognitoIdToken = await this.verifyCognitoIdToken(idToken);
      const findUser = await this.userService.getActiveUserByAuthId(verifiedCognitoIdToken.sub);
      if (!findUser) {
        throw new ForbiddenException("Account not found");
      }
      req.currentUser = {
        authId: verifiedCognitoIdToken.sub,
        _id: findUser.id,
        name: findUser.name,
        email: findUser.email,
        userRole: findUser.userRole,
      }
      next();
    } catch (error) {
      console.log("Current Middleware Error", error);
    }
  }

  async verifyCognitoIdToken(idToken) {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: configuration().aws.cognitoPoolId,
      tokenUse: "id",
      clientId: configuration().aws.cognitoClientId,
    });
    try {
      const payload = await verifier.verify(idToken);
      return payload;
    } catch (error) {
      console.log("Token Not Valid!", error);
    }
  }
}
