import OrganizationTabs from "@/components/organization-tabs";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationSubmissions } from "@/lib/organizations";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationSubmissionsPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const submissions = await listOrganizationSubmissions(organizationId);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Submissions</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Form responses</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Every submission is visible to the organizer and all accepted members.
        </p>
      </section>

      <OrganizationTabs organizationId={organizationId} isAdmin={context.isAdmin} currentPath={`/dashboard/organizations/${organizationId}/submissions`} />

      <section className="space-y-4">
        {submissions.map((submission) => (
          <article key={submission._id.toString()} className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{submission.email}</p>
                <p className="text-sm text-zinc-500">{submission.formSlug}</p>
              </div>
              <p className="text-sm text-zinc-400">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">{JSON.stringify(submission.answers, null, 2)}</pre>
          </article>
        ))}
        {submissions.length === 0 ? <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">No submissions yet.</div> : null}
      </section>
    </main>
  );
}