import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isOrganizationAdmin } from "@/lib/organizations";
import { syncStockSheetRows } from "@/lib/google-sheets";
import { upsertStockItems } from "@/lib/automation";

type RouteParams = { params: Promise<{ organizationId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only the organizer can sync stock." }, { status: 403 });
  }

  const body = (await request.json()) as { rows?: Array<{ sku: string; name: string; quantity: number }> };
  const rows = body.rows ?? [];

  await upsertStockItems(organizationId, rows);
  await syncStockSheetRows({
    organizationId,
    rows: rows.map((row) => [row.sku, row.name, String(row.quantity)]),
  });

  return NextResponse.json({ ok: true });
}