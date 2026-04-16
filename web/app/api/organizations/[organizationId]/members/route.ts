import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  createInvite,
  getUserMembership,
  isOrganizationAdmin,
  listOrganizationMembers,
} from "@/lib/organizations";
import { findUsersByIds } from "@/lib/users";

type RouteParams = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserMembership(organizationId, user.id);

  if (!membership) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const memberships = await listOrganizationMembers(organizationId);
  const members = await findUsersByIds(memberships.map((entry) => entry.userId.toString()));

  return NextResponse.json({
    members: memberships.map((entry) => ({
      userId: entry.userId.toString(),
      role: entry.role,
      acceptedAt: entry.acceptedAt,
      user: members.find((candidate) => candidate.id === entry.userId.toString()) ?? null,
    })),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can invite members." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const invite = await createInvite({
    organizationId,
    email,
    invitedBy: user.id,
  });

  return NextResponse.json({
    invite,
    link: `/join/${invite.token}`,
  }, { status: 201 });
}