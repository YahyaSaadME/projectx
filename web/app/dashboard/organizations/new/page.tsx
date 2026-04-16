import Link from "next/link";
import CreateOrganizationForm from "@/components/create-organization-form";

export default function NewOrganizationPage() {
  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">New organization</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Create a workspace</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          The creator becomes the organizer and can manage forms and submissions.
        </p>
      </section>

      <CreateOrganizationForm />

      <Link className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}