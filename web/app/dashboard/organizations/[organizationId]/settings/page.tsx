import OrganizationTabs from "@/components/organization-tabs";
import { getOrganizationPageContext } from "@/lib/organization-page";
import OrganizationSettingsPanel from "@/components/organization-settings-panel";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationSettingsPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Settings</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Update organization</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Organizers can rename or delete the organization from this page.
        </p>
      </section>

      <OrganizationTabs organizationId={organizationId} isAdmin={context.isAdmin} currentPath={`/dashboard/organizations/${organizationId}/settings`} />

      {context.isAdmin ? (
        <OrganizationSettingsPanel organizationId={organizationId} name={context.organization.name} description={context.organization.description} />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">Only the organizer can edit or delete the organization.</div>
      )}
    </main>
  );
}
