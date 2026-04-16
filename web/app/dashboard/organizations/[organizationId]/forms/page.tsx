import OrganizationTabs from "@/components/organization-tabs";
import FormBuilder from "@/components/form-builder";
import FormCardActions from "@/components/form-card-actions";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationForms } from "@/lib/organizations";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationFormsPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const forms = await listOrganizationForms(organizationId);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Forms</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Build the public contact form</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          The admin can generate a dynamic form and share it with anyone. Submitted entries are available to members and organizers.
        </p>
      </section>

      <OrganizationTabs organizationId={organizationId} isAdmin={context.isAdmin} currentPath={`/dashboard/organizations/${organizationId}/forms`} />

      {context.isAdmin ? <FormBuilder organizationId={organizationId} /> : <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">Only the organizer can create and edit forms.</div>}

      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
        <h2 className="text-xl font-semibold text-white">Existing forms</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((form) => (
            <article key={form._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">{form.title}</p>
              <p className="mt-1 text-sm text-zinc-400">/{form.slug}</p>
              <p className="mt-3 text-xs text-zinc-500">{form.isActive ? "Active" : "Disabled"}</p>
              {context.isAdmin ? <FormCardActions formId={form._id.toString()} initialActive={form.isActive} /> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}