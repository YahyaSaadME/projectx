"use client";

import { useState } from "react";

type VerifyFormProps = {
  initialEmail: string;
};

export default function VerifyForm({ initialEmail }: VerifyFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "OTP verification failed.");
        return;
      }

      setMessage(data.message ?? "OTP verified.");
    } catch {
      setError("Unable to reach the OTP verification endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl shadow-black/40 backdrop-blur">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="email">
            Email
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-white/30"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="otp">
            OTP
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-white/30"
            id="otp"
            type="text"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="6-digit code"
          />
        </div>

        {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

        <button
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </section>
  );
}