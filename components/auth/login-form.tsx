"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

const inputClassName =
  "rounded-[var(--radius-input)] border border-border bg-surface px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30";

type LoginFormProps = {
  nextPath: string;
  initialError?: string | null;
};

export function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(() =>
    initialError && initialError !== "auth" ? initialError : null,
  );
  const [magicSent, setMagicSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function mapAuthError(err: { message?: string } | null): string {
    if (!err?.message) {
      return "Something went wrong. Try again.";
    }
    if (err.message.includes("Invalid login credentials")) {
      return "Invalid email or password.";
    }
    return err.message;
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setMagicSent(false);
    startTransition(async () => {
      try {
        const supabase = createClient();
        if (mode === "signup") {
          const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: redirectTo },
          });
          if (error) {
            setMessage(mapAuthError(error));
            return;
          }
          if (data.session) {
            router.push(nextPath);
            router.refresh();
            return;
          }
          setMessage(
            "Check your email to confirm your account, then sign in.",
          );
          setMode("signin");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setMessage(mapAuthError(error));
          return;
        }
        router.push(nextPath);
        router.refresh();
      } catch {
        setMessage("Network error. Is Supabase running and env configured?");
      }
    });
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setMagicSent(false);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });
        if (error) {
          setMessage(mapAuthError(error));
          return;
        }
        setMagicSent(true);
      } catch {
        setMessage("Network error. Is Supabase running and env configured?");
      }
    });
  }

  const errorFromQuery =
    initialError === "auth"
      ? "Sign-in link expired or was invalid. Try again."
      : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Use the same email you use for staff invites and organization access.
      </p>

      {(message || errorFromQuery) && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {errorFromQuery ?? message}
        </p>
      )}

      {magicSent ? (
        <p className="mt-4 text-sm text-foreground-muted">
          If email is enabled, check your inbox for the magic link (local dev:
          open Inbucket from{" "}
          <code className="rounded bg-border/60 px-1 py-0.5 text-xs">
            supabase status
          </code>
          ).
        </p>
      ) : null}

      <form onSubmit={onPasswordSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className={inputClassName}
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Password</span>
          <input
            required={mode === "signin" || mode === "signup"}
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={6}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className={inputClassName}
            placeholder="••••••••"
          />
          <span className="text-xs text-foreground-muted">
            Minimum 6 characters (local Supabase default).
          </span>
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMessage(null);
            }}
            className="inline-flex items-center rounded-[var(--radius-button)] border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            {mode === "signin" ? "Need an account?" : "Have an account?"}
          </button>
        </div>
      </form>

      <div className="mt-10 border-t border-border pt-8">
        <h2 className="text-sm font-medium text-foreground">Magic link</h2>
        <p className="mt-1 text-xs text-foreground-muted">
          We&apos;ll email you a one-time link. Uses the same email field above.
        </p>
        <form onSubmit={onMagicLink} className="mt-4">
          <button
            type="submit"
            disabled={pending || !email.trim()}
            className="w-full rounded-[var(--radius-button)] border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-60"
          >
            Email me a sign-in link
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-foreground-muted">
        <Link href="/" className="text-primary hover:underline">
          Back home
        </Link>
        {nextPath !== "/" ? (
          <>
            {" · "}
            <Link href={nextPath} className="text-primary hover:underline">
              Continue to destination
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
