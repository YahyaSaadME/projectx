"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AgentRuleFormProps = {
  organizationId: string;
  initialPrompt?: string;
  initialRules?: string[];
  initialQueueStrategy?: "lowest_score" | "round_robin" | "manual";
  initialStockMode?: "auto_confirm" | "manual_review";
  initialEnabled?: boolean;
};

export default function AgentRuleForm({
  organizationId,
  initialPrompt = "Route leads using score-based queue and stock rules.",
  initialRules = ["Assign to the lowest score eligible member.", "Escalate stock shortages to the organizer."],
  initialQueueStrategy = "lowest_score",
  initialStockMode = "auto_confirm",
  initialEnabled = true,
}: AgentRuleFormProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [rulesText, setRulesText] = useState(initialRules.join("\n"));
  const [queueStrategy, setQueueStrategy] = useState(initialQueueStrategy);
  const [stockMode, setStockMode] = useState(initialStockMode);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rules = useMemo(
    () => rulesText.split("\n").map((rule) => rule.trim()).filter(Boolean),
    [rulesText],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, rules, queueStrategy, stockMode, enabled }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not update agent rules.");
        return;
      }

      setMessage("Agent rules saved.");
      router.refresh();
    } catch {
      setError("Unable to save agent rules.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="agent-prompt">
          Agent prompt
        </label>
        <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30" id="agent-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="agent-rules">
          Rules, one per line
        </label>
        <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30" id="agent-rules" value={rulesText} onChange={(event) => setRulesText(event.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-zinc-300">
          Queue strategy
          <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={queueStrategy} onChange={(event) => setQueueStrategy(event.target.value as typeof queueStrategy)}>
            <option value="lowest_score">Lowest score</option>
            <option value="round_robin">Round robin</option>
            <option value="manual">Manual</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-zinc-300">
          Stock mode
          <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={stockMode} onChange={(event) => setStockMode(event.target.value as typeof stockMode)}>
            <option value="auto_confirm">Auto confirm</option>
            <option value="manual_review">Manual review</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input checked={enabled} onChange={(event) => setEnabled(event.target.checked)} type="checkbox" /> Enable automation
      </label>

      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

      <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving..." : "Save rules"}
      </button>
    </form>
  );
}