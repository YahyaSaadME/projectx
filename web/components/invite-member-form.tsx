"use client";

import { useState } from "react";

type InviteMemberFormProps = {
  organizationId: string;
};

export default function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLink("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; link?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not send invitation.");
        return;
      }

      setLink(payload.link ?? "");
      setEmail("");
    } catch {
      setError("Invitation request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
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
        />
      </div>
      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {link ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Invite link: {link}</p> : null}
      <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending..." : "Send invitation"}
      </button>
    </form>
  );
}