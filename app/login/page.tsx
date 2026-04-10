import { LoginForm } from "@/components/auth/login-form";

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/";

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabase) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-4 text-sm text-foreground-muted">
          Add{" "}
          <code className="rounded bg-border/60 px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-border/60 px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to{" "}
          <code className="rounded bg-border/60 px-1 py-0.5 text-xs">
            .env.local
          </code>{" "}
          (see{" "}
          <code className="rounded bg-border/60 px-1 py-0.5 text-xs">
            .env.local.example
          </code>
          ), then restart the dev server.
        </p>
      </div>
    );
  }

  return <LoginForm nextPath={safeNext} initialError={error ?? null} />;
}
