import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isOrganizationAdmin, removeMembership } from "@/lib/organizations";

type RouteParams = {
  params: Promise<{ organizationId: string; userId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { organizationId, userId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can remove members." }, { status: 403 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  await removeMembership(organizationId, userId);
  return NextResponse.json({ ok: true });
}