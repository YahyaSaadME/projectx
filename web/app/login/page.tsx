"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleOAuthButton from "@/components/google-oauth-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      setMessage(data.message ?? "Logged in.");
      router.push("/dashboard");
    } catch {
      setError("Unable to reach the login endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#242424,_#111111_42%,_#080808_100%)] px-6 py-10 text-zinc-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Access</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Log in to your account</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
              Use your verified email and password to open the dashboard and profile pages.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-zinc-300">
            <p className="font-medium text-white">Need an account?</p>
            <p className="mt-2 text-zinc-400">Create one first, then verify the OTP before logging in.</p>
            <Link className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200" href="/signup">
              Sign up
            </Link>
            <div className="mt-4">
              <GoogleOAuthButton mode="login" />
            </div>
          </div>
        </section>

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
              <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                Password
              </label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-white/30"
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />
            </div>

            {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

            <button
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-5">
            <GoogleOAuthButton mode="login" />
          </div>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Need a new account? <Link className="text-white underline decoration-white/30 underline-offset-4" href="/signup">Create one</Link>
          </p>
        </section>
      </div>
    </main>
  );
}