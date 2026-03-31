<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: none
- Added sections: none
- Removed sections: none
- Templates: .specify/templates/plan-template.md ✅ updated |
  .specify/templates/tasks-template.md ✅ updated |
  .specify/templates/spec-template.md ✅ n/a (no mandatory spec sections added) |
  .specify/templates/checklist-template.md ✅ n/a |
  .specify/templates/agent-file-template.md ✅ n/a |
  .specify/templates/commands/*.md ⚠ absent (no directory)
- Follow-up TODOs: none
-->

# ActiviqHQ Constitution

## Core Principles

### I. Clarity and Simplicity

Code MUST be clean, straightforward, and easy to read. Prefer the simplest design that
satisfies documented requirements. When the straightforward approach is not available and
simplicity depends on a tradeoff, convention, or non-obvious choice, authors MUST comment
why that path was taken so readers are not left guessing.

**Rationale**: Readable code reduces defects and speeds change; deliberate simplicity avoids
accidental complexity.

### II. Performance With Readability

Readability MUST NOT be an excuse for ignoring performance requirements: latency, throughput,
memory, and UI responsiveness defined in specs or plans MUST still be met. When optimization
or a less “textbook-readable” structure is required, keep the code as clear as safety allows
and document the performance intent and tradeoffs in comments or the plan.

**Rationale**: Users experience performance; clarity and speed are jointly non‑negotiable
unless explicitly negotiated and recorded.

### III. Commenting Discipline

Comment regularly so intent, data flow, and non-local effects are obvious without reading
every caller. For complex algorithms, concurrency, security-sensitive paths, or framework
edge cases, MUST explain reasoning, invariants, preconditions, and failure modes—not a
narration of what each line already states.

**Rationale**: Comments pay off most where the code cannot stay trivial; they are the
cheapest form of design documentation at the point of change.

### IV. Reusable Functions and Modules

Extract named functions, hooks, or modules where logic is duplicated or clearly reusable.
Do not copy-paste with minor edits; consolidate with clear parameters. YAGNI still applies:
do not build abstraction layers “just in case” without a concrete second use or a plan
stated in the feature design.

**Rationale**: Reuse shrinks the surface area for bugs and keeps fixes consistent.

### V. Specification and Plan Fidelity

Implementation MUST align with the approved feature specification and implementation plan.
Material scope or behavior changes MUST be reflected in spec/plan (or explicitly deferred
with recorded rationale) before merge.

**Rationale**: The spec/plan chain is the system of record; code drift without documentation
is technical debt.

### VI. Small, Reviewable Delivery Units

Tasks and code changes MUST be scoped into small, self-contained chunks that are easy to
review and validate. Large efforts MUST be split into ordered subtasks with clear boundaries
and acceptance outcomes so reviewers can reason about correctness without reconstructing the
entire system at once.

**Rationale**: Smaller diffs reduce review risk, shorten feedback cycles, and improve defect
discovery before merge.

## Stack & Framework Alignment

This project uses Next.js and related tooling documented in the repository. Contributors MUST
follow current framework guidance (including deprecations) and project files such as
`AGENTS.md` when present. Constitution rules apply in addition to lint and type checks, not
instead of them.

## Review & Quality Gates

Pull requests SHOULD be reviewed for: adherence to principles I–VI; proportionality of
complexity; presence of comments where the diff introduces or preserves non-obvious logic;
and chunk size that is practical to review end-to-end. Reviewers MAY request perf validation
when the change touches hot paths or performance-sensitive requirements.

## Governance

This constitution supersedes informal style preferences when they conflict. Amendments require
an update to `.specify/memory/constitution.md`, an incremented version per semantic
versioning below, and sync of dependent templates when gates or mandatory sections change.

**Versioning**: **MAJOR** — removal or incompatible redefinition of a principle or gate;
**MINOR** — new principle, section, or materially expanded obligation; **PATCH** —
clarifications, wording, typos, non-semantic edits.

**Compliance**: Feature plans MUST pass the Constitution Check in `plan-template.md` before
Phase 0 research and re-check after Phase 1 design. Maintainers SHOULD spot-check compliance
on substantive refactors.

**Version**: 1.1.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-31
