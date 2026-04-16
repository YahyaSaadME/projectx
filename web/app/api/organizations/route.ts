import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  addMembership,
  createContactForm,
  createOrganization,
  listUserOrganizations,
} from "@/lib/organizations";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await listUserOrganizations(user.id);
  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; description?: string };
  const name = body.name?.trim();
  const description = body.description?.trim() ?? "";

  if (!name) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  const organization = await createOrganization({
    name,
    description,
    createdBy: user.id,
  });

  await addMembership({
    organizationId: organization._id.toString(),
    userId: user.id,
    role: "admin",
  });

  const defaultForm = await createContactForm({
    organizationId: organization._id.toString(),
    name: "Contact form",
    title: `Contact ${organization.name}`,
    description: "Public form shared with anyone.",
    fields: [
      { id: "name", label: "Name", type: "text", required: true, placeholder: "Full name" },
      { id: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
      { id: "message", label: "Message", type: "textarea", required: true, placeholder: "Write your message" },
    ],
    createdBy: user.id,
  });

  return NextResponse.json({ organization, defaultForm }, { status: 201 });
}