import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/users";
import { generateOtp, hashSecret } from "@/lib/auth";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SignupBody;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const otp = generateOtp();
  const user = await createUser({
    name,
    email,
    passwordHash: await hashSecret(password),
    otpHash: await hashSecret(otp),
  });

  return NextResponse.json({
    message: "Account created. Save this OTP and verify it from the verify page.",
    otp,
    user: user
      ? {
          name: user.name,
          email: user.email,
        }
      : null,
  });
}