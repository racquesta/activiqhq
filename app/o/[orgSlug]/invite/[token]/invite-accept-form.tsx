"use client";

import { useState, useTransition } from "react";

import { acceptInviteAction } from "./actions";

type Props = {
  orgSlug: string;
  token: string;
};

export function InviteAcceptForm({ orgSlug, token }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setMessage(null);
          const result = await acceptInviteAction(orgSlug, token);
          if (!result.ok) {
            setMessage(result.message);
          }
        });
      }}
    >
      {message ? (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Joining…" : "Accept invitation"}
      </button>
    </form>
  );
}
