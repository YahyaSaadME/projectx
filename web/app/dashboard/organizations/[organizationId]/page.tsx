import Link from "next/link";
import OrganizationTabs from "@/components/organization-tabs";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationForms, listOrganizationSubmissions, listOrganizationMembers } from "@/lib/organizations";

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

  const currentPath = `/dashboard/organizations/${organizationId}`;

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Organization</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{context.organization.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{context.organization.description || "No description yet."}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200" href={`/dashboard/organizations/${organizationId}/forms`}>
            Manage public forms
          </Link>
          <Link className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5" href={`/dashboard/organizations/${organizationId}/members`}>
            Invite members
          </Link>
        </div>
      </section>

      <OrganizationTabs organizationId={organizationId} isAdmin={context.isAdmin} currentPath={currentPath} />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Your role</p>
          <p className="mt-2 text-xl font-semibold text-white">{context.membership.role}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Members</p>
          <p className="mt-2 text-xl font-semibold text-white">{members.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Forms</p>
          <p className="mt-2 text-xl font-semibold text-white">{forms.length}</p>
        </article>
      </section>

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