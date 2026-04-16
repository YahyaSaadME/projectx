import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/session";
import { getOrganizationById, getUserMembership } from "@/lib/organizations";

export async function getOrganizationPageContext(organizationId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const normalizedOrganizationId = String(organizationId ?? "").trim();

  if (!isValidObjectId(normalizedOrganizationId)) {
    notFound();
  }

  const organization = await getOrganizationById(normalizedOrganizationId);

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(normalizedOrganizationId, user.id);

  if (!membership) {
    notFound();
  }

  return {
    user,
    organization,
    membership,
    isAdmin: membership.role === "admin",
  };
}