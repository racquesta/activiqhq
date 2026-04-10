import Link from "next/link";
import { redirect } from "next/navigation";

import { EnrollmentPolicyForm } from "@/components/org/enrollment-policy-form";
import { loadOrgContextWithClient, OrgContextError } from "@/lib/auth/org-context";
import { assertOwnerOrAdmin } from "@/lib/auth/permissions";
import { fetchEnrollmentPolicy } from "@/lib/org/enrollment-policy";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function EnrollmentSettingsPage({ params }: PageProps) {
  const { orgSlug } = await params;
  let ctx;
  try {
    ctx = await loadOrgContextWithClient({ orgSlug });
    assertOwnerOrAdmin(ctx);
  } catch (e) {
    if (e instanceof OrgContextError) {
      redirect("/");
    }
    throw e;
  }

  const policy = await fetchEnrollmentPolicy(ctx.supabase, ctx.organizationId);
  const initialMax = policy?.max_concurrent_activities_per_child ?? 1;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-10">
      <div className="mb-2 text-sm text-foreground-muted">
        <Link href={`/o/${orgSlug}`} className="text-primary hover:underline">
          ← {ctx.organizationName}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        Enrollment limits
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
        Set how many activities a child may be actively enrolled in at once
        across your organization.
      </p>
      <div className="mt-8">
        <EnrollmentPolicyForm orgSlug={orgSlug} initialMax={initialMax} />
      </div>
    </div>
  );
}
