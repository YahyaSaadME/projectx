import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  deleteOrganization,
  getOrganizationById,
  getUserMembership,
  isOrganizationAdmin,
  updateOrganization,
} from "@/lib/organizations";

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
  const organization = await getOrganizationById(organizationId);

  if (!organization || !membership) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  return NextResponse.json({ organization, membership });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can update an organization." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
  };

  const updated = await updateOrganization(organizationId, {
    name: body.name?.trim() ?? "",
    description: body.description?.trim() ?? "",
  });

  return NextResponse.json({ organization: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can delete an organization." }, { status: 403 });
  }

  await deleteOrganization(organizationId);
  return NextResponse.json({ ok: true });
}