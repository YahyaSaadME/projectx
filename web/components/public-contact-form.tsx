"use client";

import { useState } from "react";
import type { FormField } from "@/lib/organizations";

type PublicContactFormProps = {
  slug: string;
  fields: FormField[];
};

export default function PublicContactForm({ slug, fields }: PublicContactFormProps) {
  const [email, setEmail] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/public/forms/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers: values }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Submission failed.");
        return;
      }

      setMessage("Submission received.");
      setEmail("");
      setValues({});
    } catch {
      setError("Unable to submit the form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl shadow-black/40" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="contact-email">
          Email
        </label>
        <input
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          id="contact-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@example.com"
        />
      </div>

      {fields.map((field) => {
        const value = values[field.id] ?? "";

        return (
          <div key={field.id}>
            <label className="text-sm font-medium text-zinc-300" htmlFor={field.id}>
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
                id={field.id}
                required={field.required}
                placeholder={field.placeholder}
                value={value}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              />
            ) : field.type === "select" ? (
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                id={field.id}
                required={field.required}
                value={value}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              >
                <option value="">Select an option</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
                id={field.id}
                required={field.required}
                placeholder={field.placeholder}
                type={field.type}
                value={value}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              />
            )}
          </div>
        );
      })}

      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

      <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Send message"}
      </button>
    </form>
  );
}