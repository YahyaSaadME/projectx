import { NextResponse } from "next/server";
import { authCookieName, signJwt } from "@/lib/auth";
import { createGoogleUser, findUserByEmail, findUserByGoogleId, linkGoogleAccount } from "@/lib/users";
import { verifyGoogleCode } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=google_missing_code", request.url));
  }

  try {
    const profile = await verifyGoogleCode(code);
    const existingByGoogle = await findUserByGoogleId(profile.googleId);
    const existingByEmail = await findUserByEmail(profile.email);

    let user = existingByGoogle ?? existingByEmail;

    if (!user) {
      user = await createGoogleUser({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      });
    } else if (!existingByGoogle) {
      const linkedUser = await linkGoogleAccount({
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      });

      if (linkedUser) {
        user = linkedUser;
      }
    }

    if (!user) {
      throw new Error("Google account could not be linked or created");
    }

    const token = signJwt({ sub: user._id.toString(), email: user.email, name: user.name });
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_failed", request.url));
  }
}