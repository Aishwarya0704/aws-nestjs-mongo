import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from "amazon-cognito-identity-js";
import * as AWS from "aws-sdk";
import CustomError from "src/utilities/custom.error";

@Injectable()
export class CoreCognitoService {
  private readonly cognito: AWS.CognitoIdentityServiceProvider;

  poolData: {
    UserPoolId: string;
    ClientId: string;
  };
  poolRegion: string;
  userPool: CognitoUserPool;
  cognitoUser: CognitoUser;
  cognitoClient: AWS.CognitoIdentityServiceProvider;

  constructor(private configService: ConfigService) {
    this.poolData = {
      UserPoolId: this.configService.get("aws.cognitoPoolId"),
      ClientId: this.configService.get("aws.cognitoClientId"),
    };
    this.poolRegion = this.configService.get("aws.region");
    this.userPool = new CognitoUserPool(this.poolData);

    AWS.config.update({
      region: this.poolRegion,
    });
    AWS.config.update({
      accessKeyId: this.configService.get("aws.accessKey"),
      secretAccessKey: this.configService.get("aws.secretKey"),
    });

    this.cognito = new AWS.CognitoIdentityServiceProvider({
      region: this.poolRegion,
    });
  }

  async signup(username, password, attributeList: CognitoUserAttribute[]) {
    return new Promise((resolve, reject) => {
      this.userPool.signUp(username, password, attributeList, null, function (error, result) {
        if (error) {
          let errMessage = error.message;
          if (error.name == "CodeDeliveryFailureException") {
            errMessage = "Couldn't send email. Please check if you've entered valid email.";
          }
          return reject(new CustomError(errMessage, HttpStatus.BAD_REQUEST, error.name));
        }
        const userData = result.userSub;
        return resolve(userData);
      });
    });
  }

  async addUserToGroup(username, group) {
    console.log(username, group)
    const addUserToGroupParams = {
      GroupName: group,
      Username: username,
      UserPoolId: this.poolData.UserPoolId,
    }
    console.log(addUserToGroupParams)
    this.cognito.adminAddUserToGroup(addUserToGroupParams, (error, data) => {
      if (error) {
        console.log("error", error);
      }
      console.log("data", data);
    });
  }

  async verify(username, code) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: this.userPool,
      };
      const cognitoUser = new CognitoUser(userData);
      cognitoUser.confirmRegistration(code, true, function (error, result) {
        if (error) {
          return reject(new CustomError(error.message, HttpStatus.BAD_REQUEST, error.name));
        }
        return resolve(result);
      });
    });
  }

  async resendCode(username) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: this.userPool,
      };
      const cognitoUser = new CognitoUser(userData);
      cognitoUser.resendConfirmationCode(function (error, result) {
        if (error) {
          return reject(new CustomError(error.message, HttpStatus.BAD_REQUEST, error.name));
        }
        return resolve(result);
      });
    });
  }

  async login(email, password) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      const userData = {
        Username: email,
        Pool: this.userPool,
      };
      const cognitoUser = new CognitoUser(userData)
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
          return resolve({
            idToken: result.getIdToken().getJwtToken(),
            accessToken: result.getAccessToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
            payload: result.getIdToken().payload,
            userRole: result.getAccessToken().payload.scope,
          });
        },
        onFailure: function (error) {
          return reject(new CustomError("Invalid email or password", HttpStatus.BAD_REQUEST, error.name));
        },
      });
    });
  }

  async logout(email) {
    return new Promise((resolve) => {
      const userData = {
        Username: email,
        Pool: this.userPool,
      };
      const cognitoUser = new CognitoUser(userData);
      cognitoUser.signOut(() => {
        return resolve(true);
      });
    });
  }

  async getCognitoUser(email) {
    return new Promise((resolve, reject) => {
      const params = {
        UserPoolId: this.poolData.UserPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      };
      this.cognitoClient.listUsers(params, (error, data) => {
        if (error) {
          return reject(new CustomError(error.message, HttpStatus.BAD_REQUEST, error.name));
        }
        return resolve(data);
      });
    });
  }
}
