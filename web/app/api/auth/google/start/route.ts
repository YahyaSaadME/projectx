import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";
import { getAppBaseUrl } from "@/lib/app-url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "login";

  try {
    const authUrl = buildGoogleAuthUrl(mode);
    console.info("Google auth start", { mode });
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google auth start failed", error);
    const detail = error instanceof Error ? error.message : "google_start_failed";
    return NextResponse.redirect(new URL(`/login?error=google_failed&detail=${encodeURIComponent(detail)}`, getAppBaseUrl(request)));
  }
}