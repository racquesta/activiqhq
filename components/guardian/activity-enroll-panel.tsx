"use client";

import { useEffect, useState } from "react";

type ChildOption = { id: string; first_name: string };

type ActivityRow = {
  id: string;
  title: string;
  activityType: string;
  startsAt: string;
  endsAt: string;
};

type Props = {
  orgSlug: string;
  childrenList: ChildOption[];
};

export function ActivityEnrollPanel({ orgSlug, childrenList }: Props) {
  const [childId, setChildId] = useState(childrenList[0]?.id ?? "");
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [eligibility, setEligibility] = useState<{
    maxConcurrentActivitiesPerChild: number;
    activeEnrollmentCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ eligibleForChildId: childId });

    void (async () => {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/o/${encodeURIComponent(orgSlug)}/activities?${params.toString()}`,
        { credentials: "include" },
      );
      const json = (await res.json()) as {
        activities?: ActivityRow[];
        eligibility?: {
          maxConcurrentActivitiesPerChild: number;
          activeEnrollmentCount: number;
        };
        message?: string;
      };
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setError(json.message ?? "Could not load activities.");
        setActivities([]);
        setEligibility(null);
        setLoading(false);
        return;
      }
      setActivities(json.activities ?? []);
      setEligibility(json.eligibility ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [childId, orgSlug]);

  async function enroll(activityId: string) {
    if (!childId) return;
    setEnrollingId(activityId);
    setError(null);
    const res = await fetch(
      `/api/o/${encodeURIComponent(orgSlug)}/enrollments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ childId, activityId }),
      },
    );
    const json = (await res.json()) as { message?: string; code?: string };
    if (!res.ok) {
      setError(json.message ?? "Enrollment failed.");
      setEnrollingId(null);
      return;
    }
    setEnrollingId(null);

    const params = new URLSearchParams({ eligibleForChildId: childId });
    const refresh = await fetch(
      `/api/o/${encodeURIComponent(orgSlug)}/activities?${params.toString()}`,
      { credentials: "include" },
    );
    const refreshed = (await refresh.json()) as {
      activities?: ActivityRow[];
      eligibility?: {
        maxConcurrentActivitiesPerChild: number;
        activeEnrollmentCount: number;
      };
    };
    if (refresh.ok) {
      setActivities(refreshed.activities ?? []);
      setEligibility(refreshed.eligibility ?? null);
    }
  }

  if (childrenList.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Add a child profile first to browse activities and enroll.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium text-foreground">
          Child
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="mt-2 block w-full max-w-md rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {childrenList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {eligibility ? (
        <p className="text-xs text-foreground-muted">
          Active enrollments for this child: {eligibility.activeEnrollmentCount}{" "}
          / {eligibility.maxConcurrentActivitiesPerChild} allowed.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-foreground-muted">Loading activities…</p>
      ) : null}

      {!loading && activities.length === 0 && childId ? (
        <p className="text-sm text-foreground-muted">
          No open spots right now — you may be at the enrollment limit, or there
          are no published activities you can add.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {activities.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-foreground">{a.title}</p>
              <p className="text-xs text-foreground-muted">
                {a.activityType} ·{" "}
                {new Date(a.startsAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <button
              type="button"
              disabled={enrollingId === a.id}
              onClick={() => void enroll(a.id)}
              className="rounded-[12px] bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {enrollingId === a.id ? "Enrolling…" : "Enroll"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
