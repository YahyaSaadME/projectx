import Link from "next/link";
import FormBuilder from "@/components/form-builder";
import { getCurrentUser } from "@/lib/session";
import { getFormById, isOrganizationAdmin, getUserMembership } from "@/lib/organizations";
import { getOrganizationPageContext } from "@/lib/organization-page";

type PageProps = {
  params: Promise<{ organizationId: string; formId: string }>;
};

export default async function EditFormPage({ params }: PageProps) {
  const { organizationId, formId } = await params;
  const user = await getCurrentUser();
  const context = await getOrganizationPageContext(organizationId);

  if (!context || !user) return null;

  if (!(await isOrganizationAdmin(organizationId, user.id))) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">
          Only the organizer can edit forms.
        </div>
      </main>
    );
  }

  const form = await getFormById(formId);

  if (!form) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-red-200">
          Form not found.
        </div>
      </main>
    );
  }

  const membership = await getUserMembership(organizationId, user.id);
  if (!membership) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-red-200">
          Organization not found.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Edit form fields and publishing settings.</p>
          </div>
          <Link
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
            href={`/dashboard/organizations/${organizationId}/forms`}
          >
            Back to forms
          </Link>
        </div>
      </section>

      <FormBuilder
        organizationId={organizationId}
        isEditMode={true}
        formId={formId}
        initialName={form.name}
        initialTitle={form.title}
        initialDescription={form.description}
        initialFields={form.fields}
      />
    </main>
  );
}
