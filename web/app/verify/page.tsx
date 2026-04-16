import Link from "next/link";
import VerifyForm from "@/app/verify/verify-form";

type VerifyPageProps = {
  searchParams?: Promise<{ email?: string | string[] }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialEmail = Array.isArray(resolvedSearchParams.email)
    ? resolvedSearchParams.email[0] ?? ""
    : resolvedSearchParams.email ?? "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#242424,_#111111_42%,_#080808_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Verification</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Confirm your OTP</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
            The OTP is stored as a hash in MongoDB, so this step proves the code you received belongs to your account.
          </p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-zinc-300">
            <p className="font-medium text-white">Next step</p>
            <p className="mt-2 text-zinc-400">After verification, use email and password to log in.</p>
            <Link className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200" href="/login">
              Login
            </Link>
          </div>
        </section>

        <VerifyForm initialEmail={initialEmail} />
      </div>
    </main>
  );
}