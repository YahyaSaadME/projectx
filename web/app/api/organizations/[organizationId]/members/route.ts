import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/session";
import {
  createInvite,
  getUserMembership,
  isOrganizationAdmin,
  listOrganizationMembers,
  updateMemberWarehouse,
  type WarehouseStockItem,
} from "@/lib/organizations";
import { findUserByEmail, findUsersByIds } from "@/lib/users";

type RouteParams = {
  params: Promise<{ organizationId: string }>;
};

type WarehouseStockPayload = {
  product?: string;
  quantity?: number;
};

function parseWarehouseStock(input: WarehouseStockPayload[] | undefined) {
  if (!input) {
    return { stock: [] as WarehouseStockItem[] };
  }

  const stock: WarehouseStockItem[] = [];

  for (const item of input) {
    const product = item.product?.trim();
    const quantity = Number(item.quantity ?? 0);

    if (!product) {
      return { stock: [] as WarehouseStockItem[], error: "Each stock item needs a product name." };
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      return { stock: [] as WarehouseStockItem[], error: "Each stock item needs a valid non-negative quantity." };
    }

    stock.push({ product, quantity });
  }

  return { stock };
}

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

  const members = await listOrganizationMembers(organizationId);
  const users = await findUsersByIds(members.map((member) => member.userId.toString()));

  return NextResponse.json({
    members: members.map((member) => ({
      userId: member.userId.toString(),
      role: member.role,
      warehouseName: member.warehouseName ?? "Main warehouse",
      warehouseStock: member.warehouseStock ?? [],
      user: users.find((candidate) => candidate.id === member.userId.toString()) ?? null,
    })),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can invite members." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const existingMembership = await getUserMembership(organizationId, existingUser._id.toString());

    if (existingMembership) {
      return NextResponse.json({ error: "This email is already a member of the organization." }, { status: 409 });
    }
  }

  const invite = await createInvite({
    organizationId,
    email,
    invitedBy: user.id,
  });

  const inviteLink = `${getAppBaseUrl(request)}/join/${invite.token}`;

  return NextResponse.json({
    invite,
    link: inviteLink,
  }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return NextResponse.json({ error: "Only admins can update member warehouses." }, { status: 403 });
  }

  const body = (await request.json()) as {
    userId?: string;
    warehouseName?: string;
    warehouseStock?: WarehouseStockPayload[];
  };

  const targetUserId = body.userId?.trim();

  if (!targetUserId) {
    return NextResponse.json({ error: "Target userId is required." }, { status: 400 });
  }

  const targetMembership = await getUserMembership(organizationId, targetUserId);

  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found in organization." }, { status: 404 });
  }

  const parsedWarehouseStock = parseWarehouseStock(body.warehouseStock);

  if (parsedWarehouseStock.error) {
    return NextResponse.json({ error: parsedWarehouseStock.error }, { status: 400 });
  }

  const updatedMembership = await updateMemberWarehouse(organizationId, targetUserId, {
    warehouseName: body.warehouseName?.trim() ?? targetMembership.warehouseName ?? "Main warehouse",
    warehouseStock: parsedWarehouseStock.stock,
  });

  if (!updatedMembership) {
    return NextResponse.json({ error: "Member not found in organization." }, { status: 404 });
  }

  return NextResponse.json({ membership: updatedMembership });
}