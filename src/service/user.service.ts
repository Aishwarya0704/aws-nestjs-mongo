import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from "src/schemas/user.schema";

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name) private User: Model<UserDocument>,
  ) { }

  async register(registerDto) {
    if (registerDto.password) {
      const salt = bcrypt.genSaltSync(10);
      registerDto.password = bcrypt.hashSync(registerDto.password, salt);
    }
    return await this.User.create(registerDto);
  }

  async login(loginDto) {
    return await this.User.findOne({ email: loginDto.email }, {}, { lean: true });
  }

  async getActiveUserByEmail(email) {
    return await this.User.findOne({ email: email, status: "Active" }, { _id: 1, email: 1, userRole: 1 });
  }

  async getUnverifiedUserByEmail(email) {
    return await this.User.findOne({ email: email, status: "Unverified" }, { _id: 1, email: 1, userRole: 1 });
  }

  async updateUserById(id, data) {
    return await this.User.updateOne({ _id: id }, { $set: data });
  }

  async getActiveUserByAuthId(authId) {
    return await this.User.findOne({ authId: authId, status: "Active" }, { _id: 1, name: 1, email: 1, userRole: 1 });
  }

  async getProfile(userId) {
    return await this.User.findOne({ _id: userId }, { name: 1, email: 1 });
  }

  async getAllUsers() {
    return await this.User.find({ userRole: "User" }, { name: 1, email: 1, status: 1, userRole: 1 });
  }
}