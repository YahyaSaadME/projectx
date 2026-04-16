import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  createContactForm,
  getUserMembership,
  isOrganizationAdmin,
  listOrganizationForms,
  type FormField,
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

  if (!membership) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const forms = await listOrganizationForms(organizationId);
  return NextResponse.json({ forms });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can create forms." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    title?: string;
    description?: string;
    fields?: FormField[];
  };

  const form = await createContactForm({
    organizationId,
    name: body.name?.trim() ?? "Custom form",
    title: body.title?.trim() ?? "Contact form",
    description: body.description?.trim() ?? "",
    fields:
      body.fields?.length && body.fields.length > 0
        ? body.fields
        : [
            { id: "name", label: "Name", type: "text", required: true, placeholder: "Full name" },
            { id: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
            { id: "message", label: "Message", type: "textarea", required: true, placeholder: "Write your message" },
          ],
    createdBy: user.id,
  });

  return NextResponse.json({ form }, { status: 201 });
}