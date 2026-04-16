"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrganizationSettingsPanelProps = {
  organizationId: string;
  name: string;
  description: string;
};

export default function OrganizationSettingsPanel({ organizationId, name, description }: OrganizationSettingsPanelProps) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(name);
  const [orgDescription, setOrgDescription] = useState(description);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, description: orgDescription }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Update failed.");
        return;
      }

      setMessage("Organization updated.");
      router.refresh();
    } catch {
      setError("Could not update organization.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setError("");
    setMessage("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Delete failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not delete organization.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="grid gap-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSave}>
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="org-name">
            Organization name
          </label>
          <input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" id="org-name" value={orgName} onChange={(event) => setOrgName(event.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="org-description">
            Description
          </label>
          <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" id="org-description" value={orgDescription} onChange={(event) => setOrgDescription(event.target.value)} />
        </div>
        {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
        <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 shadow-xl shadow-black/30">
        <h2 className="text-xl font-semibold text-white">Danger zone</h2>
        <p className="mt-3 text-sm leading-7 text-red-100/80">Deleting the organization removes members, invites, forms, and submissions.</p>
        {error && !message ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-black/20 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        <button className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isDeleting} onClick={handleDelete} type="button">
          {isDeleting ? "Deleting..." : "Delete organization"}
        </button>
      </div>
    </div>
  );
}