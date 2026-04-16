import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listUserOrganizations } from "@/lib/organizations";
import CreateOrganizationForm from "@/components/create-organization-form";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const organizations = await listUserOrganizations(user.id);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Welcome back, {user.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Create organizations, build public contact forms, and review all submissions from one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200" href="/dashboard/organizations/new">
              Create organization
            </Link>
            <Link className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5" href="/profile">
              Profile
            </Link>
          </div>
        </div>

        <CreateOrganizationForm />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Signed in as</p>
          <p className="mt-2 text-xl font-semibold text-white">{user.email}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Organizations</p>
          <p className="mt-2 text-xl font-semibold text-white">{organizations.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-sm text-zinc-400">Role</p>
          <p className="mt-2 text-xl font-semibold text-white">Organizer or member</p>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Your organizations</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Manage the workspace</h2>
          </div>
          <p className="text-sm text-zinc-400">Open any organization to manage forms and submissions</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-zinc-400">
              No organizations yet. Create your first one above.
            </div>
          ) : null}

          {organizations.map((organization) => (
            <Link
              key={organization._id}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-white/25 hover:bg-white/5"
              href={`/dashboard/organizations/${organization._id}`}
            >
              <p className="text-lg font-semibold text-white">{organization.name}</p>
              <p className="mt-2 text-sm text-zinc-400">Role: {organization.role}</p>
              <p className="mt-1 text-xs text-zinc-500">/{organization.slug}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}