"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormField, FormFieldType } from "@/lib/organizations";

type FormBuilderProps = {
  organizationId: string;
};

const fieldTypes: FormFieldType[] = ["text", "email", "textarea", "select"];

function createField(): FormField {
  return {
    id: `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    label: "New field",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
  };
}

export default function FormBuilder({ organizationId }: FormBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState("Contact form");
  const [title, setTitle] = useState("Contact us");
  const [description, setDescription] = useState("Public form shared with anyone.");
  const [fields, setFields] = useState<FormField[]>([
    { id: "name", label: "Name", type: "text", required: true, placeholder: "Full name" },
    { id: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
    { id: "message", label: "Message", type: "textarea", required: true, placeholder: "Write your message" },
  ]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => name.trim().length > 0 && title.trim().length > 0, [name, title]);

  function updateField(index: number, updates: Partial<FormField>) {
    setFields((current) => current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...updates } : field)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, description, fields }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not create form.");
        return;
      }

      setMessage("Form created.");
      router.refresh();
    } catch {
      setError("Form creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="form-name">
            Form name
          </label>
          <input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30" id="form-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="form-title">
            Title
          </label>
          <input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30" id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="form-description">
          Description
        </label>
        <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30" id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">Fields</p>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5" type="button" onClick={() => setFields((current) => [...current, createField()])}>
            <Plus className="h-3.5 w-3.5" /> Add field
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 md:grid-cols-[1.1fr_0.8fr_0.6fr_0.8fr_auto] md:items-center">
            <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} />
            <select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" value={field.type} onChange={(event) => updateField(index, { type: event.target.value as FormFieldType })}>
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" value={field.placeholder ?? ""} onChange={(event) => updateField(index, { placeholder: event.target.value })} placeholder="Placeholder" />
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} type="checkbox" /> Required
            </label>
            <button className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-zinc-300 transition hover:bg-white/5" type="button" onClick={() => setFields((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

      <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canSubmit || isSubmitting} type="submit">
        {isSubmitting ? "Saving..." : "Save form"}
      </button>
    </form>
  );
}