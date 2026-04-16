import mongoose, { Schema, type Model } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";

export type UserRecord = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  otpHash: string;
  otpVerified: boolean;
  authProvider: "local" | "google";
  googleId?: string;
  avatarUrl?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  otpVerified: boolean;
  createdAt: string;
};

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user._id?.toString() ?? "",
    name: user.name,
    email: user.email,
    otpVerified: user.otpVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const UserSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpVerified: { type: Boolean, required: true, default: false },
    authProvider: { type: String, required: true, default: "local", enum: ["local", "google"] },
    googleId: { type: String },
    avatarUrl: { type: String },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
    googleTokenExpiry: { type: Date },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

const UserModel: Model<UserRecord> =
  (mongoose.models.User as Model<UserRecord> | undefined) ?? mongoose.model<UserRecord>("User", UserSchema);

export async function findUserByEmail(email: string) {
  await connectMongoose();
  return UserModel.findOne({ email: normalizeEmail(email) }).lean<UserRecord>().exec();
}

export async function findUserById(id: string) {
  await connectMongoose();
  return UserModel.findById(id).lean<UserRecord>().exec();
}

export async function findUsersByIds(ids: string[]) {
  await connectMongoose();
  const users = await UserModel.find({ _id: { $in: ids } }).lean<UserRecord[]>().exec();

  return users.map((user) => asPublicUser(user));
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  otpHash: string;
}) {
  await connectMongoose();
  const createdUser = await UserModel.create({
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    otpHash: input.otpHash,
    authProvider: "local",
  });

  return createdUser.toObject() as UserRecord;
}

export async function createGoogleUser(input: {
  name: string;
  email: string;
  googleId: string;
  avatarUrl?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
}) {
  await connectMongoose();
  const createdUser = await UserModel.create({
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    passwordHash: "google-oauth",
    otpHash: "google-oauth",
    otpVerified: true,
    authProvider: "google",
    googleId: input.googleId,
    avatarUrl: input.avatarUrl,
    googleAccessToken: input.googleAccessToken,
    googleRefreshToken: input.googleRefreshToken,
    googleTokenExpiry: input.googleTokenExpiry,
  });

  return createdUser.toObject() as UserRecord;
}

export async function linkGoogleAccount(input: {
  email: string;
  googleId: string;
  avatarUrl?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
}) {
  await connectMongoose();
  return UserModel.findOneAndUpdate(
    { email: normalizeEmail(input.email) },
    {
      $set: {
        authProvider: "google",
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        ...(input.googleAccessToken ? { googleAccessToken: input.googleAccessToken } : {}),
        ...(input.googleRefreshToken ? { googleRefreshToken: input.googleRefreshToken } : {}),
        ...(input.googleTokenExpiry ? { googleTokenExpiry: input.googleTokenExpiry } : {}),
        otpVerified: true,
      },
    },
    { new: true },
  )
    .lean<UserRecord>()
    .exec();
}

export async function findUserByGoogleId(googleId: string) {
  await connectMongoose();
  return UserModel.findOne({ googleId }).lean<UserRecord>().exec();
}

export async function verifyUserOtp(email: string) {
  await connectMongoose();
  await UserModel.updateOne(
    { email: normalizeEmail(email) },
    { $set: { otpVerified: true, updatedAt: new Date() } },
  );
}

export function asPublicUser(user: UserRecord) {
  return toPublicUser(user);
}

export async function updateGoogleTokens(
  userId: string,
  input: {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: Date | null;
  },
) {
  await connectMongoose();

  const setPayload: Partial<Pick<UserRecord, "googleAccessToken" | "googleRefreshToken" | "googleTokenExpiry">> = {};

  if (input.googleAccessToken) {
    setPayload.googleAccessToken = input.googleAccessToken;
  }

  if (input.googleRefreshToken) {
    setPayload.googleRefreshToken = input.googleRefreshToken;
  }

  if (input.googleTokenExpiry) {
    setPayload.googleTokenExpiry = input.googleTokenExpiry;
  }

  if (Object.keys(setPayload).length === 0) {
    return;
  }

  await UserModel.updateOne({ _id: userId }, { $set: setPayload }).exec();
}