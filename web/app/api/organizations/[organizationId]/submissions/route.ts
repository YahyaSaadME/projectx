import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserMembership, listOrganizationSubmissions } from "@/lib/organizations";

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

  const submissions = await listOrganizationSubmissions(organizationId);
  return NextResponse.json({ submissions });
}