import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { incrementMemberScore, isOrganizationAdmin } from "@/lib/organizations";

type RouteParams = { params: Promise<{ organizationId: string; userId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { organizationId, userId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can update scores." }, { status: 403 });
  }

  const body = (await request.json()) as { delta?: number };
  const delta = Number(body.delta ?? 0);

  if (!Number.isFinite(delta)) {
    return NextResponse.json({ error: "Delta must be a number." }, { status: 400 });
  }

  await incrementMemberScore(organizationId, userId, delta, false);
  return NextResponse.json({ ok: true });
}