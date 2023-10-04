import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import { CurrentUser } from "src/decorators/currentUser.decorator";
import { AdminGuard } from "src/guards/admin.guard";
import { AuthGuard } from "src/guards/auth.guard";
import { UserGuard } from "src/guards/user.guard";
import { CoreCognitoService } from "src/service/core.cognito";
import { ResponseService } from "src/service/response.service";
import { UsersService } from "src/service/user.service";

@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private coreCognito: CoreCognitoService,
    private configService: ConfigService,
  ) { }

  @Post("register")
  @HttpCode(HttpStatus.OK)
  async register(@Body() body) {
    try {
      // const getCognitoUser = await this.coreCognito.getCognitoUser(body.email);
      let attributeList = [];

      attributeList.push(new CognitoUserAttribute({ Name: "name", Value: body.name }));
      attributeList.push(new CognitoUserAttribute({ Name: "email", Value: body.email }));

      const cognitoUser = await this.coreCognito.signup(body.email, body.password, attributeList);
      const addedUserToGroup = await this.coreCognito.addUserToGroup(body.email, body.userRole)
      console.log(addedUserToGroup)

      const saveUser = await this.usersService.register({
        authId: cognitoUser,
        name: body.name,
        email: body.email,
        password: body.password,
        userRole: body.userRole
      });
      return ResponseService.sendResponse(saveUser);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  async verifyUser(@Body() body) {
    const user = await this.usersService.getUnverifiedUserByEmail(body.email);
    await this.coreCognito.verify(body.email, body.code);
    const updateObj = { status: "Active" };
    await this.usersService.updateUserById(user._id, updateObj);
    return ResponseService.sendResponse("SUCCESS");
  }

  @Post("resend-code")
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() body) {
    const user = await this.usersService.getUnverifiedUserByEmail(body.email);
    await this.coreCognito.resendCode(user.email);
    return ResponseService.sendResponse("SUCCESS");
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body) {
    const user = await this.usersService.getActiveUserByEmail(body.email);
    let loginRes = await this.coreCognito.login(body.email, body.password);
    await this.usersService.login(body);
    return ResponseService.sendResponse(
      {
        idToken: loginRes["idToken"],
        refreshToken: loginRes["refreshToken"],
        name: loginRes["payload"]["name"],
        email: loginRes["payload"]["email"],
        userRole: user.userRole,
      }
    )
  }

  @Get("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logout(@CurrentUser() user) {
    try {
      await this.coreCognito.logout(user);
      return ResponseService.sendResponse("SUCCESS");
    } catch (error) {
      throw new BadRequestException("Something went wrong");
    }
  }

  @Get("user/profile")
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async getProfile(@CurrentUser() user) {
    try {
      const data = await this.usersService.getProfile(user._id);
      return ResponseService.sendResponse(data);
    } catch (error) {
      throw new BadRequestException("Something went wrong");
    }
  }

  @Get("admin/displayUsers")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  async getAllUsers() {
    try {
      const data = await this.usersService.getAllUsers();
      return ResponseService.sendResponse(data);
    } catch (error) {
      throw new BadRequestException("Something went wrong");
    }
  }

}
