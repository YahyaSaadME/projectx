import Link from "next/link";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationForms, listOrganizationMembers, listOrganizationSubmissions } from "@/lib/organizations";

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
  const totalStockUnits = members.reduce((sum, member) => {
    const warehouseStock = member.warehouseStock ?? [];
    return sum + warehouseStock.reduce((stockSum, item) => stockSum + item.quantity, 0);
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
        <Link className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5" href={`/dashboard/organizations/${organizationId}/warehouse`}>
          Manage warehouse
        </Link>
      </div>

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

    </main>
  );
}