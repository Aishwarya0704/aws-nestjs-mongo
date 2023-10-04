import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  collection: "Users",
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  authId: string;

  @Prop({
    required: true,
    trim: true,
  })
  password: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
  })
  userRole: string;

  @Prop({
    required: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    default: "Unverified",
  })
  status: string;

}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User)
  .index({ authId: 1 }, { unique: true })
  .index({ email: 1 }, { unique: true })
  .index({ email: 1, status: 1 });

