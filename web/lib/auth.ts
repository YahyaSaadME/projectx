import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const authCookieName = "auth-token";

export type JwtUser = {
  sub: string;
  email: string;
  name: string;
};

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashSecret(value: string) {
  return bcrypt.hash(value, 10);
}

export function compareSecret(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}

export function signJwt(user: JwtUser) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign(user, jwtSecret, { expiresIn: "7d" });
}

export function verifyJwt(token: string) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.verify(token, jwtSecret) as JwtUser;
}