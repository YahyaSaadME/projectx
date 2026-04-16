"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleOAuthButton from "@/components/google-oauth-button";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setOtp(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await response.json()) as { error?: string; otp?: string };

      if (!response.ok) {
        setError(data.error ?? "Signup failed.");
        return;
      }

      setOtp(data.otp ?? null);
    } catch {
      setError("Unable to reach the signup endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#242424,_#111111_42%,_#080808_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Create account</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Sign up with your name</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
              This starter hashes the password and OTP before writing them to MongoDB.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-zinc-300">
            <p className="font-medium text-white">Already verified?</p>
            <p className="mt-2 text-zinc-400">Go straight to login after creating your account.</p>
            <Link className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200" href="/login">
              Login
            </Link>
            <div className="mt-4">
              <GoogleOAuthButton mode="signup" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-zinc-300" htmlFor="name">
                Name
              </label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-white/30"
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
              />
            </div>

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
              <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                Password
              </label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-white/30"
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

            {otp ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <p className="font-medium text-white">Signup complete</p>
                <p className="mt-1">Your OTP is <span className="font-semibold text-white">{otp}</span>. Verify it on the verify page before logging in.</p>
                <button
                  className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  type="button"
                  onClick={() => router.push(`/verify?email=${encodeURIComponent(email)}`)}
                >
                  Verify OTP
                </button>
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <div className="mt-5">
            <GoogleOAuthButton mode="signup" />
          </div>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account? <Link className="text-white underline decoration-white/30 underline-offset-4" href="/login">Login</Link>
          </p>
        </section>
      </div>
    </main>
  );
}