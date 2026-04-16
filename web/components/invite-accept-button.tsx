"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InviteAcceptButtonProps = {
  token: string;
};

export default function InviteAcceptButton({ token }: InviteAcceptButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccept() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/invites/${token}`, { method: "POST" });
      const payload = (await response.json()) as { ok?: boolean; error?: string; organizationId?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not accept the invitation.");
        return;
      }

      setMessage("Invitation accepted.");

      if (payload.organizationId) {
        router.push(`/dashboard/organizations/${payload.organizationId}`);
      }

      router.refresh();
    } catch {
      setError("Invitation acceptance failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        onClick={handleAccept}
        type="button"
      >
        {isSubmitting ? "Accepting..." : "Accept invitation"}
      </button>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
