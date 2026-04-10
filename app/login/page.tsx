import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Wire your Supabase Auth UI (email magic link, OAuth, etc.) here. Until
        then, use the Supabase dashboard or your app’s auth flow to create a
        session, then open the link you were given.
      </p>
      {next ? (
        <p className="mt-4 text-sm">
          <span className="text-foreground-muted">After signing in: </span>
          <Link href={next} className="text-primary hover:underline">
            continue
          </Link>
        </p>
      ) : null}
      <p className="mt-8 text-xs text-foreground-muted">
        <Link href="/" className="text-primary hover:underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
