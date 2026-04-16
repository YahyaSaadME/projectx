import { OAuth2Client } from "google-auth-library";

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are required");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getGoogleOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleCredentials();
  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

export function buildGoogleAuthUrl(mode: "login" | "signup") {
  const client = getGoogleOAuthClient();

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
    ],
    state: mode,
  });
}

export async function verifyGoogleCode(code: string) {
  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Google did not return an id token");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    throw new Error("Google profile payload is incomplete");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.given_name ?? payload.email,
    avatarUrl: payload.picture ?? undefined,
    googleAccessToken: tokens.access_token ?? undefined,
    googleRefreshToken: tokens.refresh_token ?? undefined,
    googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
  };
}