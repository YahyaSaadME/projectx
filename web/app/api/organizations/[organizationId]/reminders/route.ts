import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createReminder, listReminders } from "@/lib/automation";
import { getUserMembership } from "@/lib/organizations";

type RouteParams = { params: Promise<{ organizationId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getUserMembership(organizationId, user.id);
  if (!membership) return NextResponse.json({ error: "Organization not found." }, { status: 404 });

  const reminders = await listReminders(organizationId);
  return NextResponse.json({ reminders });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { email?: string; title?: string; dueAt?: string };
  if (!body.email || !body.title || !body.dueAt) {
    return NextResponse.json({ error: "Email, title, and due date are required." }, { status: 400 });
  }

  const reminder = await createReminder({
    organizationId,
    email: body.email,
    title: body.title,
    dueAt: new Date(body.dueAt),
    userId: user.id,
  });

  return NextResponse.json({ reminder }, { status: 201 });
}