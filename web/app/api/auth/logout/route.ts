import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/app-url";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", getAppBaseUrl(request)));

  response.cookies.set(authCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}