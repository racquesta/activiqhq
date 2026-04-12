"use client";

import { useState } from "react";

type Props = {
  orgSlug: string;
  initialMax: number;
};

export function EnrollmentPolicyForm({ orgSlug, initialMax }: Props) {
  const [max, setMax] = useState(String(initialMax));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const n = Number(max);
    if (!Number.isInteger(n) || n < 1) {
      setError("Enter a whole number of at least 1.");
      setSaving(false);
      return;
    }
    const res = await fetch(
      `/api/o/${encodeURIComponent(orgSlug)}/enrollment-policy`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ maxConcurrentActivitiesPerChild: n }),
      },
    );
    const json = (await res.json()) as {
      maxConcurrentActivitiesPerChild?: number;
      message?: string;
      code?: string;
    };
    if (!res.ok) {
      setError(json.message ?? "Could not save policy.");
      setSaving(false);
      return;
    }
    if (json.maxConcurrentActivitiesPerChild !== undefined) {
      setMax(String(json.maxConcurrentActivitiesPerChild));
    }
    setSavedAt(new Date().toLocaleTimeString());
    setSaving(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-card)] border border-border bg-surface p-6"
    >
      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-foreground">
        Max concurrent activities per child
        <input
          type="number"
          min={1}
          step={1}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="mt-2 w-full max-w-[200px] rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground"
          name="maxConcurrentActivitiesPerChild"
        />
      </label>
      <p className="mt-2 max-w-xl text-xs text-foreground-muted">
        Guardians cannot add more active enrollments than this limit for any one
        child. Existing enrollments count toward the cap.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[12px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save policy"}
        </button>
        {savedAt ? (
          <span className="text-xs text-foreground-muted">
            Saved at {savedAt}
          </span>
        ) : null}
      </div>
    </form>
  );
}
