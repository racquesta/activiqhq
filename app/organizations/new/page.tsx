"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      let body: { code?: string; message?: string; slug?: string } = {};
      const text = await res.text();
      if (text) {
        try {
          body = JSON.parse(text) as typeof body;
        } catch {
          setError(
            res.ok
              ? "Unexpected response from server."
              : `Request failed (${res.status}). ${text.slice(0, 120)}`,
          );
          setPending(false);
          return;
        }
      }
      if (!res.ok) {
        setError(body.message ?? "Could not create organization.");
        setPending(false);
        return;
      }
      if (body.slug) {
        router.push(`/o/${body.slug}/settings/staff`);
        return;
      }
      setError("Unexpected response from server.");
    } catch {
      setError("Network error. Try again.");
    }
    setPending(false);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">
        Create an organization
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Choose a display name and a URL slug. The slug appears in links your
        team and families use (for example{" "}
        <span className="font-mono text-xs">/o/your-slug</span>).
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Organization name</span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            className="rounded-[var(--radius-input)] border border-border bg-surface px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Northside Dance Studio"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">URL slug</span>
          <input
            required
            minLength={3}
            maxLength={64}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Lowercase letters, numbers, and single hyphens between segments"
            value={slug}
            onChange={(ev) =>
              setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            className="rounded-[var(--radius-input)] border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="northside-dance"
          />
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create organization"}
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-[var(--radius-button)] border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
