"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReminderFormProps = {
  organizationId: string;
};

export default function ReminderForm({ organizationId }: ReminderFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, title, dueAt }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not save reminder.");
        return;
      }

      setMessage("Reminder created.");
      router.refresh();
    } catch {
      setError("Unable to create reminder.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-3">
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="member@example.com" />
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 md:col-span-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Follow-up reminder" />
      </div>
      <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
      <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating..." : "Create reminder"}
      </button>
    </form>
  );
}