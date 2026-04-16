import { OAuth2Client } from "google-auth-library";
import { getOrganizationById, listOrganizationMembers } from "@/lib/organizations";
import { findUserById } from "@/lib/users";

type ResolvedGoogleAccount = {
  client: OAuth2Client;
  email: string;
  userId?: string;
};

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

function createClientWithTokens(tokens: {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: Date | null;
}) {
  const client = getOAuthClient();

  if (!client) {
    return null;
  }

  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate?.getTime(),
  });

  return client;
}

async function resolveUserAccount(userId: string): Promise<ResolvedGoogleAccount | null> {
  const user = await findUserById(userId);

  if (!user) {
    return null;
  }

  const client = createClientWithTokens({
    accessToken: user.googleAccessToken,
    refreshToken: user.googleRefreshToken,
    expiryDate: user.googleTokenExpiry ?? null,
  });

  if (!client || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return null;
  }

  return {
    client,
    email: user.email,
    userId: user._id.toString(),
  };
}

export async function resolveGoogleAccount(input: {
  organizationId?: string;
  preferredUserId?: string;
}): Promise<ResolvedGoogleAccount | null> {
  const preferredIds = new Set<string>();

  if (input.preferredUserId) {
    preferredIds.add(input.preferredUserId);
  }

  if (input.organizationId) {
    const organization = await getOrganizationById(input.organizationId);

    if (organization?.createdBy) {
      preferredIds.add(organization.createdBy.toString());
    }

    const members = await listOrganizationMembers(input.organizationId);
    const sortedMembers = [...members].sort((left, right) => {
      const roleWeight = (role: string) => (role === "admin" ? 0 : 1);
      return roleWeight(left.role) - roleWeight(right.role);
    });

    for (const membership of sortedMembers) {
      preferredIds.add(membership.userId.toString());
    }
  }

  for (const userId of preferredIds) {
    const resolved = await resolveUserAccount(userId);
    if (resolved) {
      return resolved;
    }
  }

  const fallbackRefreshToken = process.env.GOOGLE_MAIL_REFRESH_TOKEN;
  const fallbackSenderEmail = process.env.GOOGLE_MAIL_SENDER_EMAIL ?? process.env.GOOGLE_MAIL_FROM_EMAIL;

  if (!fallbackRefreshToken || !fallbackSenderEmail) {
    return null;
  }

  const client = createClientWithTokens({
    refreshToken: fallbackRefreshToken,
  });

  if (!client) {
    return null;
  }

  return {
    client,
    email: fallbackSenderEmail,
  };
}
