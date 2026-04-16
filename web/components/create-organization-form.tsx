"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not create organization.");
        return;
      }

      setName("");
      setDescription("");
      router.refresh();
    } catch {
      setError("Organization creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="org-name">
          Organization name
        </label>
        <input
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          id="org-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Labs"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="org-description">
          Description
        </label>
        <textarea
          className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          id="org-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What does this organization do?"
        />
      </div>
      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      <button
        className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating..." : "Create organization"}
      </button>
    </form>
  );
}