import { NextResponse } from "next/server";
import { authCookieName, compareSecret, signJwt } from "@/lib/auth";
import { findUserByEmail } from "@/lib/users";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const passwordMatches = await compareSecret(password, user.passwordHash);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.otpVerified) {
    return NextResponse.json({ error: "Verify your OTP before logging in." }, { status: 403 });
  }

  const token = signJwt({
    sub: user._id?.toString() ?? "",
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.json({
    message: "Login successful.",
    user: {
      name: user.name,
      email: user.email,
    },
  });

  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}