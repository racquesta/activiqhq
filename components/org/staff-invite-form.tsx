"use client";

import { useState } from "react";

type Props = {
  orgSlug: string;
};

export function StaffInviteForm({ orgSlug }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "instructor" | "coach">("admin");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setPending(true);
    const res = await fetch(
      `/api/o/${encodeURIComponent(orgSlug)}/invites`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), role }),
      },
    );
    const body = (await res.json()) as {
      message?: string;
      invite?: { acceptPath?: string; token?: string };
    };
    if (!res.ok) {
      setError(body.message ?? "Invite failed.");
      setPending(false);
      return;
    }
    const path =
      typeof window !== "undefined" && body.invite?.acceptPath
        ? `${window.location.origin}${body.invite.acceptPath}`
        : body.invite?.acceptPath ?? "";
    setResult(
      path
        ? `Invite created. Share this link once: ${path}`
        : "Invite created.",
    );
    setEmail("");
    setPending(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex max-w-xl flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4"
    >
      <h3 className="text-sm font-semibold text-foreground">New invite</h3>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <p className="break-all text-sm text-foreground-muted">{result}</p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground-muted">Role</span>
        <select
          value={role}
          onChange={(ev) =>
            setRole(ev.target.value as "admin" | "instructor" | "coach")
          }
          className="rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="coach">Coach</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-fit rounded-[var(--radius-button)] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Sending…" : "Create invite"}
      </button>
    </form>
  );
}
