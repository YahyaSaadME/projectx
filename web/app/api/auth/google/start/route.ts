import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "login";
  return NextResponse.redirect(buildGoogleAuthUrl(mode));
}