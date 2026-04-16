import { NextResponse } from "next/server";
import { compareSecret } from "@/lib/auth";
import { findUserByEmail, verifyUserOtp } from "@/lib/users";

type VerifyBody = {
  email?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as VerifyBody;
  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const otpMatches = await compareSecret(otp, user.otpHash);

  if (!otpMatches) {
    return NextResponse.json({ error: "Invalid OTP." }, { status: 401 });
  }

  await verifyUserOtp(email);

  return NextResponse.json({ message: "OTP verified. You can log in now." });
}