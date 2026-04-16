import { NextResponse } from "next/server";
import { getFormBySlug, submitContactForm } from "@/lib/organizations";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    email?: string;
    answers?: Record<string, string>;
  };

  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const submission = await submitContactForm({
    organizationId: form.organizationId.toString(),
    formId: form._id.toString(),
    formSlug: form.slug,
    email,
    answers,
  });

  return NextResponse.json({ submission }, { status: 201 });
}