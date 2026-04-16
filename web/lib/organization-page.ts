import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOrganizationById, getUserMembership } from "@/lib/organizations";

export async function getOrganizationPageContext(organizationId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(organizationId, user.id);

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