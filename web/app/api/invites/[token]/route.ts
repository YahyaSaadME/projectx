import { NextResponse } from "next/server";
import { acceptInvite, getInviteByToken } from "@/lib/organizations";
import { getCurrentUser } from "@/lib/session";

type RouteParams = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  return NextResponse.json({
    invite: {
      organizationId: invite.organizationId.toString(),
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
    },
  });
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required to accept an invitation." }, { status: 401 });
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  if (invite.email !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "This invitation only works for the invited email." }, { status: 403 });
  }

  const accepted = await acceptInvite(token, user.id, user.email);

  if (!accepted) {
    return NextResponse.json({ error: "Invitation could not be accepted." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, organizationId: accepted.organizationId.toString() });
}
