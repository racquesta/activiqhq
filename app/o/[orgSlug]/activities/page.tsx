import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityEnrollPanel } from "@/components/guardian/activity-enroll-panel";
import { loadOrgContextWithClient, OrgContextError } from "@/lib/auth/org-context";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgActivitiesPage({ params }: PageProps) {
  const { orgSlug } = await params;
  let ctx;
  try {
    ctx = await loadOrgContextWithClient({ orgSlug });
  } catch (e) {
    if (e instanceof OrgContextError) {
      redirect("/");
    }
    throw e;
  }

  if (!ctx.isGuardian) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 py-10">
        <div className="mb-2 text-sm text-foreground-muted">
          <Link href={`/o/${orgSlug}`} className="text-primary hover:underline">
            ← {ctx.organizationName}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Guardian accounts enroll children from this page. Staff can manage
          activities from the organization dashboard when activity management is
          enabled.
        </p>
      </div>
    );
  }

  const { data: childrenRows } = await ctx.supabase
    .from("child_profiles")
    .select("id, first_name")
    .eq("organization_id", ctx.organizationId)
    .eq("guardian_user_id", ctx.userId)
    .order("first_name", { ascending: true });

  const childrenList = (childrenRows ?? []).map((c) => ({
    id: c.id,
    first_name: c.first_name,
  }));

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-10">
      <div className="mb-2 text-sm text-foreground-muted">
        <Link href={`/o/${orgSlug}`} className="text-primary hover:underline">
          ← {ctx.organizationName}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        Activities & enrollment
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
        Choose a child, then enroll in published activities that fit your
        organization&apos;s per-child limit.
      </p>
      <div className="mt-8">
        <ActivityEnrollPanel orgSlug={orgSlug} childrenList={childrenList} />
      </div>
    </div>
  );
}
