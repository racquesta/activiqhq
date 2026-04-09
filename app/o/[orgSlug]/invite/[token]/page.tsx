import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { InviteAcceptForm } from "./invite-accept-form";

type PageProps = {
  params: Promise<{ orgSlug: string; token: string }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { orgSlug, token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("slug", orgSlug)
    .maybeSingle();

  const title = org?.name ?? orgSlug;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Join {title}</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        You have been invited to help manage this organization on ActiviqHQ.
      </p>

      {!user ? (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-sm text-foreground-muted">
            Sign in with the email address that received the invite, then return
            to this page to accept.
          </p>
          <Link
            href={`/login?next=/o/${encodeURIComponent(orgSlug)}/invite/${encodeURIComponent(token)}`}
            className="inline-flex justify-center rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <InviteAcceptForm orgSlug={orgSlug} token={token} />
        </div>
      )}
    </div>
  );
}
