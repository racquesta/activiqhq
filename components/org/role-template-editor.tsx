"use client";

import { useState } from "react";

export type RoleTemplateRow = {
  id: string;
  role: string;
  can_manage_activities: boolean;
  can_manage_enrollments: boolean;
  can_manage_staff: boolean;
  updated_at: string;
};

type Props = {
  orgSlug: string;
  templates: RoleTemplateRow[];
};

const labels: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  coach: "Coach",
};

export function RoleTemplateEditor({ orgSlug, templates }: Props) {
  const [rows, setRows] = useState(templates);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchRole(
    role: string,
    field: "can_manage_activities" | "can_manage_enrollments" | "can_manage_staff",
    value: boolean,
  ) {
    setSaving(role);
    setError(null);
    const body: Record<string, boolean> = {};
    if (field === "can_manage_activities") body.canManageActivities = value;
    if (field === "can_manage_enrollments") body.canManageEnrollments = value;
    if (field === "can_manage_staff") body.canManageStaff = value;

    const res = await fetch(
      `/api/o/${encodeURIComponent(orgSlug)}/role-templates/${encodeURIComponent(role)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );
    const json = (await res.json()) as {
      template?: RoleTemplateRow;
      message?: string;
    };
    if (!res.ok) {
      setError(json.message ?? "Could not save.");
      setSaving(null);
      return;
    }
    if (json.template) {
      setRows((prev) =>
        prev.map((r) => (r.role === role ? json.template! : r)),
      );
    }
    setSaving(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Activities</th>
              <th className="px-4 py-3 font-medium">Enrollments</th>
              <th className="px-4 py-3 font-medium">Staff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {labels[row.role] ?? row.role}
                  {saving === row.role ? (
                    <span className="ml-2 text-xs font-normal text-foreground-muted">
                      Saving…
                    </span>
                  ) : null}
                </td>
                {(
                  [
                    ["can_manage_activities", row.can_manage_activities],
                    ["can_manage_enrollments", row.can_manage_enrollments],
                    ["can_manage_staff", row.can_manage_staff],
                  ] as const
                ).map(([field, checked]) => (
                  <td key={field} className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={saving === row.role}
                      onChange={(ev) =>
                        patchRole(row.role, field, ev.target.checked)
                      }
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-foreground-muted">
        Owners always have full access. These toggles apply to staff roles and
        will gate product features as the app grows.
      </p>
    </div>
  );
}
