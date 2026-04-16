import Link from "next/link";
import InviteMemberForm from "@/components/invite-member-form";
import MemberWarehouseManager from "@/components/member-warehouse-manager";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationForms, listOrganizationMembers, listOrganizationSubmissions } from "@/lib/organizations";
import { findUsersByIds } from "@/lib/users";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationOverviewPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const [forms, submissions, members] = await Promise.all([
    listOrganizationForms(organizationId),
    listOrganizationSubmissions(organizationId),
    listOrganizationMembers(organizationId),
  ]);
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
      warehouseStock: member.warehouseStock ?? [],
    };
  });

  const totalStockUnits = memberWarehouseData.reduce((sum, member) => {
    return sum + member.warehouseStock.reduce((stockSum, item) => stockSum + item.quantity, 0);
  }, 0);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Organization</p>
          <p className="mt-2 text-xl font-semibold text-white">{context.organization.name}</p>
          <p className="mt-2 text-sm text-zinc-500">{context.organization.description || "No description yet."}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Your role</p>
          <p className="mt-2 text-xl font-semibold text-white">{context.membership.role}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Forms</p>
          <p className="mt-2 text-xl font-semibold text-white">{forms.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Submissions</p>
          <p className="mt-2 text-xl font-semibold text-white">{submissions.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Members</p>
          <p className="mt-2 text-xl font-semibold text-white">{members.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Warehouse units</p>
          <p className="mt-2 text-xl font-semibold text-white">{totalStockUnits}</p>
        </article>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200" href={`/dashboard/organizations/${organizationId}/forms`}>
          Manage public forms
        </Link>
        <Link className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5" href={`/dashboard/organizations/${organizationId}/submissions`}>
          View submissions
        </Link>
      </div>

      {context.isAdmin ? <InviteMemberForm organizationId={organizationId} /> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <h2 className="text-xl font-semibold text-white">Recent forms</h2>
          <div className="mt-4 space-y-3">
            {forms.map((form) => (
              <div key={form._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                <p className="font-medium text-white">{form.title}</p>
                <p className="mt-1 text-zinc-400">/{form.slug}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <h2 className="text-xl font-semibold text-white">Latest submissions</h2>
          <div className="mt-4 space-y-3">
            {submissions.slice(0, 4).map((submission) => (
              <div key={submission._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                <p className="font-medium text-white">{submission.email}</p>
                <p className="mt-1 text-zinc-400">{new Date(submission.submittedAt).toLocaleString()}</p>
              </div>
            ))}
            {submissions.length === 0 ? <p className="text-sm text-zinc-400">No submissions yet.</p> : null}
          </div>
        </div>
      </section>

      {context.isAdmin ? (
        <MemberWarehouseManager organizationId={organizationId} members={memberWarehouseData} />
      ) : (
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <h2 className="text-xl font-semibold text-white">Member warehouses</h2>
          <p className="mt-2 text-sm text-zinc-400">Each organization member has one warehouse and product stock quantities.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {memberWarehouseData.map((member) => (
              <article key={member.userId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{member.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{member.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">{member.warehouseName}</p>

                <div className="mt-3 space-y-2">
                  {member.warehouseStock.map((stockItem, index) => (
                    <div key={`${member.userId}-${stockItem.product}-${index}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300">
                      <span>{stockItem.product}</span>
                      <span className="font-medium text-white">{stockItem.quantity}</span>
                    </div>
                  ))}

                  {member.warehouseStock.length === 0 ? <p className="text-sm text-zinc-500">No products in warehouse yet.</p> : null}
                </div>
              </article>
            ))}

            {memberWarehouseData.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">No members found in this organization.</div>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}