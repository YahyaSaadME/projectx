"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MemberScoreAdjusterProps = {
  organizationId: string;
  userId: string;
};

export default function MemberScoreAdjuster({ organizationId, userId }: MemberScoreAdjusterProps) {
  const router = useRouter();
  const [delta, setDelta] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await fetch(`/api/organizations/${organizationId}/members/${userId}/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: Number(delta) }),
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="mt-4 flex items-center gap-2" onSubmit={handleSubmit}>
      <input className="w-20 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" type="number" value={delta} onChange={(event) => setDelta(event.target.value)} />
      <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
        {isSaving ? "Saving..." : "Adjust score"}
      </button>
    </form>
  );
}