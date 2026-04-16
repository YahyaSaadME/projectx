import Link from "next/link";
import InviteMemberForm from "@/components/invite-member-form";
import MemberWarehouseManager from "@/components/member-warehouse-manager";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationMembers } from "@/lib/organizations";
import { findUsersByIds } from "@/lib/users";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationWarehousePage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const members = await listOrganizationMembers(organizationId);
  const users = await findUsersByIds(members.map((member) => member.userId.toString()));
  const usersById = new Map(users.map((user) => [user.id, user]));
  const memberWarehouseData = members.map((member) => {
    const memberUser = usersById.get(member.userId.toString());

    return {
      userId: member.userId.toString(),
      role: member.role,
      name: memberUser?.name ?? member.userId.toString(),
      email: memberUser?.email ?? "Unknown email",
      warehouseName: member.warehouseName ?? "Main warehouse",
      warehouseLocation: member.warehouseLocation ?? "Common warehouse location",
      warehouseStock: member.warehouseStock ?? [],
    };
  });

  const editableMembers = context.isAdmin
    ? memberWarehouseData
    : memberWarehouseData.filter((member) => member.userId === context.user.id);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Warehouse</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {context.isAdmin ? "Manage member warehouses" : "Manage your warehouse"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          {context.isAdmin
            ? "Add products, quantities, and common location for each member warehouse inside this organization."
            : "Add products, quantities, and common location for your warehouse."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={`/dashboard/organizations/${organizationId}`}>
            Back to overview
          </Link>
          <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={`/dashboard/organizations/${organizationId}/submissions`}>
            View submissions
          </Link>
          <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={`/dashboard/organizations/${organizationId}/warehouse/products`}>
            All products table
          </Link>
        </div>
      </section>

      {context.isAdmin ? <InviteMemberForm organizationId={organizationId} /> : null}

      {editableMembers.length > 0 ? (
        <MemberWarehouseManager
          organizationId={organizationId}
          members={editableMembers}
          canManageAllMembers={context.isAdmin}
        />
      ) : (
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <h2 className="text-xl font-semibold text-white">Warehouse</h2>
          <p className="mt-2 text-sm text-zinc-400">No warehouse record found for your membership.</p>
        </section>
      )}
    </main>
  );
}
