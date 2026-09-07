# Government priority + approval workflow — what changed

This is a **diff package**, not a full project export. It contains only the
files that are new or modified. Drop each file into the matching path inside
your `manus/` project (overwriting the old version), then follow "How to
deploy" below.

## The workflow now implemented

1. Citizen submits a report → the AI pipeline (`ai-pipeline/main.py`) finds
   the problem's "genome": classification (domain / severity / confidence)
   + embedding-based duplicate match — this step already existed, untouched.
2. **New:** the pipeline computes a `priority_score` (0–100) from severity,
   classification confidence, and how many citizens have independently
   reported the same problem.
   - `priority_score < 25` → `gov_review_status = 'DISCARDED'`. Treated as
     a random/noise report. Never shown in any portal.
   - `priority_score >= 25` → `gov_review_status = 'PENDING_REVIEW'`.
     Visible **only** in the government portal. **Not** visible to students.
3. A government official opens **Pending Approvals** (new page), reviews
   the problem, and either **Approves** or **Rejects** it.
4. Only once approved (`gov_review_status = 'GOV_APPROVED'`) does the
   problem become visible in the student portal (`/api/problems/relevant`,
   `/api/problems/map`, `/api/problems/:id`, `/api/problems/search`,
   `/api/public/problems`) and therefore to universities (who see it
   through students who pick it up).

Every additional citizen report on an already-existing problem recomputes
its priority score (more corroborating reports push it up, possibly across
the review threshold) — but a problem an official already approved/rejected
is never silently re-gated by new reports.

## Files changed

| File | What changed |
|---|---|
| `database/gov_priority_workflow.sql` | **New** migration: adds `priority_score`, `gov_review_status`, `discard_reason`, `reviewed_by`, `reviewed_at`, `review_remarks` to `reports`. Backfills existing rows as `GOV_APPROVED` so nothing already live disappears. |
| `ai-pipeline/ai-pipeline/main.py` | Adds `compute_priority_score()` / `gov_review_gate()` and wires them into both the "new problem" insert and the "merged into existing problem" update paths. |
| `backend/src/types/citizenProblem.ts` | Adds `priorityScore` / `govReviewStatus` to `AiPipelineResult`. |
| `backend/src/types/government.ts` | Adds `GovReviewStatus` type + `VALID_GOV_REVIEW_STATUSES`. |
| `backend/src/controllers/govController.ts` | New: `getPendingGovProblems`, `approveGovProblem`, `rejectGovProblem`. `getDashboardStats` now returns `pending_approval`. `getGovProblems` now sorts by priority score and excludes discarded reports by default, with an optional `reviewStatus` filter. |
| `backend/src/routes/govRoutes.ts` | New routes: `GET /gov/problems/pending`, `POST /gov/problems/:id/approve`, `POST /gov/problems/:id/reject`. |
| `backend/src/controllers/problemController.ts` | **The student-visibility gate.** Every student/public query now requires `gov_review_status = 'GOV_APPROVED'`. `joinProblem` also re-checks this so a student can't join a not-yet-approved problem via a stale link. |
| `frontend/src/types/government.ts` | Adds `GovReviewStatus`, `GovProblem`, `pending_approval` on `DashboardStats`. |
| `frontend/src/services/govProblemService.ts` | Adds `getPendingProblems`, `approveProblem`, `rejectProblem`; `getProblems` accepts a `reviewStatus` filter. |
| `frontend/src/pages/gov/GovPendingApprovals.tsx` | **New page.** Priority-sorted approval queue with priority-score bars, Approve button, and a Reject modal that requires a reason. |
| `frontend/src/pages/gov/GovProblems.tsx` | Adds a review-status filter dropdown (Approved / Pending / Rejected). |
| `frontend/src/pages/gov/GovDashboard.tsx` | Adds a "pending approval" banner + stat card, links to the new queue. |
| `frontend/src/components/gov/GovSidebar.tsx` | Adds a "Pending Approvals" nav item with a live unread-count badge. |
| `frontend/src/components/gov/GovProblemCard.tsx` | Adds priority-score and review-status badges. Also fixes a pre-existing bug: the card was reading `problem.title`/`problem.description`, which don't exist on the API response (`problem_title`/`problem_description`) — cards were rendering blank. |
| `frontend/src/App.tsx` | Registers the `/government/approvals` route. |

## How to deploy

```bash
# 1. Copy the files from this package over your project (see CHANGES.md table above)

# 2. Run the new migration (after your existing schema files)
psql "$DATABASE_URL" -f database/gov_priority_workflow.sql

# 3. Rebuild backend & AI pipeline (no new npm/pip dependencies were added)
cd backend && npm run build   # or npm run dev
# restart your ai-pipeline (uvicorn/whatever you use to run main.py)

# 4. Rebuild frontend
cd frontend && npm run build   # or npm run dev
```

No new environment variables, no new npm/pip packages. Both `backend`
(`npx tsc --noEmit`) and `frontend` (`npx tsc -b`) were verified to compile
with zero new errors introduced by this change.

## Tuning the priority threshold

`PRIORITY_DISCARD_THRESHOLD` in `ai-pipeline/main.py` (default `25`, 0–100
scale) controls the discard cutoff. Raise it to be stricter about what
reaches the government portal at all; lower it to let more through for
human review. It's read from the `PRIORITY_DISCARD_THRESHOLD` env var, so
you can tune it without a code change.

---

## Note on this zip

This is the **full merged project** (all four portals: student, university,
government, industry) with the changes above already applied in place —
not a diff. `node_modules`, `.git`, and `backend/dist` were stripped to
keep the download small; run `npm install` in `backend/` and `frontend/`
before running it, same as any fresh checkout.
