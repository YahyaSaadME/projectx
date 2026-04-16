import PublicContactForm from "@/components/public-contact-form";
import { getFormBySlug, getOrganizationById } from "@/lib/organizations";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">Form not found.</div>
      </main>
    );
  }

  const organization = await getOrganizationById(form.organizationId.toString());

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#242424,_#111111_42%,_#080808_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Public form</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{form.title}</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">{form.description}</p>
          <p className="mt-3 text-sm text-zinc-500">Organization: {organization?.name ?? "Unknown"}</p>
        </section>

        <PublicContactForm fields={form.fields} slug={form.slug} />
      </div>
    </main>
  );
}