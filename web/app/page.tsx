import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#2b2b2b,_#111111_45%,_#080808_100%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 md:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Mongo Auth Starter</p>
            <h1 className="mt-2 text-xl font-semibold text-white">Black and Gray Dashboard</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <Link className="rounded-full border border-white/15 px-4 py-2 text-zinc-200 transition hover:border-white/30 hover:bg-white/5" href="/login">
              Login
            </Link>
            <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200" href="/signup">
              Sign up
            </Link>
          </div>
        </header>

        <section className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.25em] text-zinc-400">
              Email, password, JWT, MongoDB
            </p>
            <h2 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Simple auth with profile and dashboard.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 md:text-lg">
              Sign up with your name, email, password, and OTP. Passwords and OTPs are hashed before storage, JWTs are issued on login, and authenticated users land on a clean dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200" href="/signup">
                Create account
              </Link>
              <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/30 hover:bg-white/5" href="/dashboard">
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm font-medium text-zinc-300">Included pages</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <p>• Signup with name, email, password, and OTP</p>
                <p>• Login with JWT session cookie</p>
                <p>• Protected dashboard and profile pages</p>
                <p>• MongoDB-backed user storage</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
