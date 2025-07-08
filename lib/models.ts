import mongoose, { Document, Schema } from "mongoose";

// Interface dla CsvFile
export interface ICsvFile extends Document {
  filename: string;
  uploadDate: Date;
  recordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface dla CsvRecord
export interface ICsvRecord extends Document {
  fileId: mongoose.Types.ObjectId;
  data: Record<string, any>;
  hash: string;
  createdAt: Date;
}

// Interface dla Contact
export interface IContact extends Document {
  name: string;
  email: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface dla EmailHistory
export interface IEmailHistory extends Document {
  to: string;
  subject: string;
  message: string;
  attachmentInfo?: string;
  sentAt: Date;
  status: "sent" | "failed";
  error?: string;
}

// Schema dla CsvFile
const CsvFileSchema = new Schema<ICsvFile>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    recordCount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "csv_files",
  },
);

// Schema dla CsvRecord
const CsvRecordSchema = new Schema<ICsvRecord>(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "CsvFile",
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    collection: "csv_records",
  },
);

// Schema dla Contact
const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "contacts",
  },
);

// Schema dla EmailHistory
const EmailHistorySchema = new Schema<IEmailHistory>(
  {
    to: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachmentInfo: {
      type: String,
      default: "",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    error: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "email_history",
  },
);

// Modele
export const CsvFile =
  mongoose.models.CsvFile || mongoose.model<ICsvFile>("CsvFile", CsvFileSchema);
export const CsvRecord =
  mongoose.models.CsvRecord ||
  mongoose.model<ICsvRecord>("CsvRecord", CsvRecordSchema);
export const Contact =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);
export const EmailHistory =
  mongoose.models.EmailHistory ||
  mongoose.model<IEmailHistory>("EmailHistory", EmailHistorySchema);
