import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserMembership, isOrganizationAdmin } from "@/lib/organizations";
import { getAgentRule, upsertAgentRule } from "@/lib/automation";

type RouteParams = { params: Promise<{ organizationId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getUserMembership(organizationId, user.id);
  if (!membership) return NextResponse.json({ error: "Organization not found." }, { status: 404 });

  const rule = await getAgentRule(organizationId);
  return NextResponse.json({ rule });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only the organizer can update rules." }, { status: 403 });
  }

  const body = (await request.json()) as {
    prompt?: string;
    rules?: string[];
    queueStrategy?: "lowest_score" | "round_robin" | "manual";
    stockMode?: "auto_confirm" | "manual_review";
    enabled?: boolean;
  };

  const rule = await upsertAgentRule({
    organizationId,
    prompt: body.prompt ?? "Route leads using score-based queue and stock rules.",
    rules: body.rules ?? [],
    queueStrategy: body.queueStrategy ?? "lowest_score",
    stockMode: body.stockMode ?? "auto_confirm",
    enabled: typeof body.enabled === "boolean" ? body.enabled : true,
    updatedBy: user.id,
  });

  return NextResponse.json({ rule });
}