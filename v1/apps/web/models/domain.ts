import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDomain extends Document {
  userId: string;
  domain: string;
  verified: boolean;
  verificationToken: string;
  verificationMethod: "dns" | "file" | "meta" | null;
  isThirdPartyHost: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
}

const DomainSchema = new Schema<IDomain>(
  {
    userId: { type: String, required: true, index: true },
    domain: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String, required: true },
    verificationMethod: { type: String, enum: ["dns", "file", "meta", null], default: null },
    isThirdPartyHost: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

DomainSchema.index({ userId: 1, domain: 1 }, { unique: true });

export const Domain: Model<IDomain> =
  mongoose.models.Domain || mongoose.model<IDomain>("Domain", DomainSchema);