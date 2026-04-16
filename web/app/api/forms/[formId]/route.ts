import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getFormById, isOrganizationAdmin, updateContactForm, deleteContactForm, getUserMembership } from "@/lib/organizations";

type RouteParams = {
  params: Promise<{ formId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { formId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await getFormById(formId);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  if (!(await getUserMembership(form.organizationId.toString(), user.id))) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  return NextResponse.json({ form });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { formId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await getFormById(formId);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  if (!(await isOrganizationAdmin(form.organizationId.toString(), user.id))) {
    return NextResponse.json({ error: "Only admins can edit forms." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    title?: string;
    description?: string;
    fields?: { id: string; label: string; type: "text" | "email" | "textarea" | "select"; required: boolean; placeholder?: string; options?: string[] }[];
    isActive?: boolean;
  };

  const updated = await updateContactForm(formId, {
    name: body.name?.trim() ?? form.name,
    title: body.title?.trim() ?? form.title,
    description: body.description?.trim() ?? form.description,
    fields: body.fields ?? form.fields,
    isActive: typeof body.isActive === "boolean" ? body.isActive : form.isActive,
  });

  return NextResponse.json({ form: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { formId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await getFormById(formId);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  if (!(await isOrganizationAdmin(form.organizationId.toString(), user.id))) {
    return NextResponse.json({ error: "Only admins can delete forms." }, { status: 403 });
  }

  await deleteContactForm(formId);
  return NextResponse.json({ ok: true });
}