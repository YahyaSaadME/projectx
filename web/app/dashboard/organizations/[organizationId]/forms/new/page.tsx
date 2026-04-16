import Link from "next/link";
import FormBuilder from "@/components/form-builder";
import { getOrganizationPageContext } from "@/lib/organization-page";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function CreateOrganizationFormPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) return null;

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Create a new public form for collecting submissions.</p>
          </div>
          <Link
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
            href={`/dashboard/organizations/${organizationId}/forms`}
          >
            Back to forms
          </Link>
        </div>
      </section>

      {context.isAdmin ? (
        <FormBuilder organizationId={organizationId} />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">
          Only the organizer can create forms.
        </div>
      )}
    </main>
  );
}
