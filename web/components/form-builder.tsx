"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormField, FormFieldType } from "@/lib/organizations";

type FormBuilderProps = {
  organizationId: string;
  isEditMode?: boolean;
  formId?: string;
  initialName?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialFields?: FormField[];
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

export default function FormBuilder({
  organizationId,
  isEditMode = false,
  formId,
  initialName = "Contact form",
  initialTitle = "Contact us",
  initialDescription = "Public form shared with anyone.",
  initialFields,
}: FormBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<FormField[]>(
    initialFields ?? [
      { id: "name", label: "Name", type: "text", required: true, placeholder: "Full name" },
      { id: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
      { id: "message", label: "Message", type: "textarea", required: true, placeholder: "Any extra details" },
    ],
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && title.trim().length > 0;

  function updateField(index: number, updates: Partial<FormField>) {
    setFields((current) =>
      current.map((field, i) => (i === index ? { ...field, ...updates } : field)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/forms/${formId}` : `/api/organizations/${organizationId}/forms`;
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          title,
          description,
          fields,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? `Could not ${isEditMode ? "update" : "create"} form.`);
        return;
      }

      setSuccessMessage(`Form ${isEditMode ? "updated" : "created"}.`);
      router.refresh();
    } catch {
      setError(`Form ${isEditMode ? "update" : "creation"} failed.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-6 rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30"
      onSubmit={handleSubmit}
    >
      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="form-name">
            Form name
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
            id="form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300" htmlFor="form-title">
            Public title
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
            id="form-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300" htmlFor="form-description">
          Description
        </label>
        <textarea
          className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          id="form-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Form fields */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Fields</p>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
            type="button"
            onClick={() => setFields((f) => [...f, createField()])}
          >
            <Plus className="h-3.5 w-3.5" /> Add field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 md:grid-cols-[1.2fr_0.8fr_0.9fr_auto_auto] md:items-center"
            >
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Label"
              />
              <select
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                value={field.type}
                onChange={(e) => updateField(index, { type: e.target.value as FormFieldType })}
              >
                {fieldTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                value={field.placeholder ?? ""}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                placeholder="Placeholder"
              />
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  type="checkbox"
                />
                Required
              </label>
              <button
                className="inline-flex items-center justify-center rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-red-400"
                type="button"
                onClick={() => setFields((f) => f.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </p>
      )}

      <button
        className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canSubmit || isSubmitting}
        type="submit"
      >
        {isSubmitting
          ? `${isEditMode ? "Updating" : "Saving"}...`
          : `${isEditMode ? "Update" : "Save"} form`}
      </button>
    </form>
  );
}