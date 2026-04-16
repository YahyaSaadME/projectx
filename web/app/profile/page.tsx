import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#232323,_#111111_45%,_#080808_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{user.name}</h1>
              <p className="mt-2 text-sm text-zinc-400">Your account details are loaded from MongoDB.</p>
            </div>
            <div className="flex gap-3">
              <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5" href="/dashboard">
                Dashboard
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200" type="submit">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-sm text-zinc-400">Full name</p>
            <p className="mt-2 text-2xl font-semibold text-white">{user.name}</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-sm text-zinc-400">Email</p>
            <p className="mt-2 text-2xl font-semibold text-white">{user.email}</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-sm text-zinc-400">Account created</p>
            <p className="mt-2 text-2xl font-semibold text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-sm text-zinc-400">OTP status</p>
            <p className="mt-2 text-2xl font-semibold text-white">Verified</p>
          </article>
        </section>
      </div>
    </main>
  );
}