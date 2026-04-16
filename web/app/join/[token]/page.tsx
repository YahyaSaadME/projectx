import Link from "next/link";
import InviteAcceptButton from "@/components/invite-accept-button";
import { getInviteByToken } from "@/lib/organizations";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#242424,#111111_42%,#080808_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-4xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Invitation</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Join the organization</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            This invite can only be accepted by the invited email address after logging in.
          </p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-zinc-300">
            <p className="font-medium text-white">Need to log in first?</p>
            <Link className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200" href="/login">
              Go to login
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          {invite ? (
            <>
              <p className="text-sm text-zinc-400">Invited email</p>
              <p className="mt-2 text-2xl font-semibold text-white">{invite.email}</p>
              <p className="mt-2 text-sm text-zinc-500">Status: {invite.status}</p>
              <div className="mt-8">
                <InviteAcceptButton token={token} />
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Invitation not found.</p>
          )}
        </section>
      </div>
    </main>
  );
}
