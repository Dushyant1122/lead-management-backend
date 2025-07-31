import mongoose, { Document, Schema } from "mongoose";
import {
  AvailableUserRoles,
  UserRoleTypes,
  UserStatusValues,
  UserStatusTypes,
} from "../constants";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId | string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone?: string;
  otp?: string;
  otpExpiry?: Date;
  role: UserRoleTypes;
  manager?: mongoose.Types.ObjectId;
  token?: string;
  tokenExpiry: Date;
  isVerified: boolean;
  isActive: boolean;
  status: UserStatusTypes;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    userName: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    phone: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },

    role: {
      type: String,
      enum: AvailableUserRoles,
      default: "TELECALLER",
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IUser) {
        return this.role === "TELECALLER" || this.role === "BACKEND";
      },
    },

    token: { type: String },
    tokenExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    status: {
      type: String,
      enum: Object.values(UserStatusValues),
      default: UserStatusValues.ACTIVE,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
