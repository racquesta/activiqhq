import Link from "next/link";

import { requireOrgContext } from "@/lib/auth/org-context";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgHomePage({ params }: PageProps) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext({ orgSlug });

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">
        {ctx.organizationName}
      </h1>
      <p className="mt-2 text-foreground-muted">
        Signed in as staff or guardian for this organization.
      </p>
      {ctx.isGuardian || ctx.isStaff ? (
        <ul className="mt-8 flex flex-col gap-3 text-sm">
          {ctx.isGuardian ? (
            <li>
              <Link
                href={`/o/${ctx.organizationSlug}/activities`}
                className="text-primary hover:underline"
              >
                Activities & enrollment
              </Link>
            </li>
          ) : null}
          {ctx.isStaff && (ctx.role === "owner" || ctx.role === "admin") ? (
            <li>
              <Link
                href={`/o/${ctx.organizationSlug}/settings/enrollment`}
                className="text-primary hover:underline"
              >
                Enrollment limits
              </Link>
            </li>
          ) : null}
          {ctx.isStaff ? (
            <li>
              <Link
                href={`/o/${ctx.organizationSlug}/settings/staff`}
                className="text-primary hover:underline"
              >
                Staff & invites
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
