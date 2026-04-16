"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StockSyncFormProps = {
  organizationId: string;
};

export default function StockSyncForm({ organizationId }: StockSyncFormProps) {
  const router = useRouter();
  const [rowsText, setRowsText] = useState("SKU-1,Sample item,10");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const rows = rowsText
        .split("\n")
        .map((line) => line.split(",").map((part) => part.trim()))
        .filter((row) => row.length >= 3)
        .map(([sku, name, quantity]) => ({ sku, name, quantity: Number(quantity) || 0 }));

      const response = await fetch(`/api/organizations/${organizationId}/stock/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not sync stock.");
        return;
      }

      setMessage("Stock synced.");
      router.refresh();
    } catch {
      setError("Unable to sync stock.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="stock-rows">
          Stock rows: SKU, Name, Quantity
        </label>
        <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30" id="stock-rows" value={rowsText} onChange={(event) => setRowsText(event.target.value)} />
      </div>
      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
      <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Syncing..." : "Sync stock"}
      </button>
    </form>
  );
}