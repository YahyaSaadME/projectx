"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RemoveMemberButtonProps = {
  organizationId: string;
  userId: string;
};

export default function RemoveMemberButton({ organizationId, userId }: RemoveMemberButtonProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      await fetch(`/api/organizations/${organizationId}/members/${userId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <button className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60" disabled={isRemoving} type="button" onClick={handleRemove}>
      {isRemoving ? "Removing..." : "Remove member"}
    </button>
  );
}