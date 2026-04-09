import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleTemplateEditor } from "@/components/org/role-template-editor";
import { StaffInviteForm } from "@/components/org/staff-invite-form";
import { loadOrgContextWithClient, OrgContextError } from "@/lib/auth/org-context";
import { assertOwnerOrAdmin } from "@/lib/auth/permissions";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function StaffSettingsPage({ params }: PageProps) {
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

  const { supabase, organizationId } = ctx;

  const [{ data: invites }, { data: memberships }, { data: templates }] =
    await Promise.all([
      supabase
        .from("invites")
        .select("id, email, role, status, expires_at, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("organization_memberships")
        .select("id, user_id, role, status, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("role_templates")
        .select(
          "id, role, can_manage_activities, can_manage_enrollments, can_manage_staff, updated_at",
        )
        .eq("organization_id", organizationId)
        .order("role"),
    ]);

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-10">
      <div className="mb-2 text-sm text-foreground-muted">
        <Link href={`/o/${orgSlug}`} className="text-primary hover:underline">
          ← {ctx.organizationName}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        Staff & invitations
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
        Invite admins, instructors, or coaches by email. They must sign in with
        that email to accept. Share the invite link from the response (or your
        logs) until outbound email is wired.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Role capabilities
        </h2>
        <div className="mt-4">
          <RoleTemplateEditor orgSlug={orgSlug} templates={templates ?? []} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">Team members</h2>
        <ul className="mt-4 divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
          {(memberships ?? []).map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <span className="font-mono text-xs text-foreground-muted">
                {m.user_id}
              </span>
              <span className="font-medium capitalize">{m.role}</span>
              <span className="text-foreground-muted">{m.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">Invites</h2>
        <StaffInviteForm orgSlug={orgSlug} />
        <ul className="mt-6 divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
          {(invites ?? []).length === 0 ? (
            <li className="px-4 py-6 text-sm text-foreground-muted">
              No invites yet.
            </li>
          ) : (
            (invites ?? []).map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>{inv.email}</span>
                <span className="capitalize text-foreground-muted">
                  {inv.role}
                </span>
                <span className="text-foreground-muted">{inv.status}</span>
                <span className="text-xs text-foreground-muted">
                  expires {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
