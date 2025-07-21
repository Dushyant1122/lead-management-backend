import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  name: string;
  phone: string;
  uploadedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  status: "Not Called" | "In Progress" | "Positive" | "Negative";
  firstCallDate?: Date;
  nextFollowupDate?: Date;
  notes?: string;
  tvrForm?: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
  assignedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Not Called", "In Progress", "Positive", "Negative"],
      default: "Not Called",
    },
    firstCallDate: {
      type: Date,
    },
    nextFollowupDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    tvrForm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TVR",
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = mongoose.model<ILead>("Lead", leadSchema);
