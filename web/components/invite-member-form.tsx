"use client";

import { useState } from "react";

type InviteMemberFormProps = {
  organizationId: string;
};

export default function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInviteLink("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; link?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not create invitation.");
        return;
      }

      setInviteLink(payload.link ?? "");
      setEmail("");
    } catch {
      setError("Invitation request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      setError("Could not copy invite link.");
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-semibold text-white">Invite member by email</p>
        <p className="mt-1 text-xs text-zinc-400">
          The generated join link only works for the same invited email.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="invite-email">
          Member email
        </label>
        <input
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          id="invite-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="member@example.com"
          required
        />
      </div>

      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      {inviteLink ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-medium">Invitation link created</p>
          <p className="mt-2 break-all text-xs text-emerald-200/90">{inviteLink}</p>
          <button
            className="mt-3 rounded-xl border border-emerald-400/40 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-400/10"
            type="button"
            onClick={handleCopyInviteLink}
          >
            Copy link
          </button>
        </div>
      ) : null}

      <button
        className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating invite..." : "Create invite link"}
      </button>
    </form>
  );
}
