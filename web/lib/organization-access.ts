import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getOrganizationById,
  getUserMembership,
  isOrganizationAdmin as checkOrganizationAdmin,
} from "@/lib/organizations";

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireOrganizationMember(organizationId: string) {
  const user = await requireCurrentUser();
  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    redirect("/dashboard");
  }

  const membership = await getUserMembership(organizationId, user.id);

  if (!membership) {
    redirect("/dashboard");
  }

  return { user, organization, membership };
}

export async function requireOrganizationAdmin(organizationId: string) {
  const context = await requireOrganizationMember(organizationId);
  const admin = await checkOrganizationAdmin(organizationId, context.user.id);

  if (!admin) {
    redirect(`/dashboard/organizations/${organizationId}`);
  }

  return context;
}

// Backward-compatible helper used by legacy routes/pages.
export async function isOrganizationAdmin(userId: string, organizationId: string) {
  return checkOrganizationAdmin(organizationId, userId);
}