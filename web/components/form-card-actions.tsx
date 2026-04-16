"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FormCardActionsProps = {
  formId: string;
  initialActive: boolean;
};

export default function FormCardActions({ formId, initialActive }: FormCardActionsProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggle() {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        return;
      }

      setIsActive(!isActive);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="button" onClick={handleToggle}>
        {isActive ? "Disable" : "Enable"}
      </button>
      <button className="rounded-full border border-red-500/20 px-4 py-2 text-xs text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60" disabled={isDeleting} type="button" onClick={handleDelete}>
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}