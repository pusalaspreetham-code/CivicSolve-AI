# Merge notes — Student + University + Government + Industry portal

This project now combines three previously-separate branches of CivicSolve AI:

- **Student + University/Faculty/Teams portal** (original base)
- **Government portal** (merged in)
- **Industry portal** (merged in)

## Industry portal merge (latest)

The industry branch was built from an earlier snapshot of the project — it
predates the faculty-guidance and team-solution features already present in
this codebase. So this merge layers the industry code on top of the
up-to-date base rather than the other way around; nothing from the
student/university/government side was removed or downgraded.

### Backend (`backend/src`)
- **Added** (industry-only, no conflicts): `controllers/industryAuthController.ts`,
  `controllers/industryController.ts`, `middleware/industryAuthMiddleware.ts`,
  `routes/industryRoutes.ts`, `services/industryOtpService.ts`, `types/industry.ts`
  (new file, following the same pattern as `types/government.ts`).
- **Merged**:
  - `app.ts` — now also mounts `/api/industry`.
  - `utils/jwt.ts` — added `signIndustryToken` / `verifyIndustryToken`
    (industry tokens carry `role: "industry"` and are validated accordingly,
    same pattern as the existing university tokens).
  - `services/emailService.ts` — added `sendIndustryOtpEmail`, built on top
    of the shared `dispatchMail` helper (so it gets the same
    missing-credentials dev fallback as every other OTP email, instead of
    calling the raw transporter directly like the original industry branch did).

### Frontend (`frontend/src`)
- **Added**: `pages/industry/*`, `components/IndustryLayout.tsx`,
  `components/IndustryProtectedRoute.tsx`, `context/IndustryAuthContext.tsx`,
  `services/industryApi.ts`, `industryAuthService.ts`, `industryService.ts`,
  `types/industry.ts`.
- **Merged**: `App.tsx` (added `IndustryAuthProvider` + the industry route
  tree), `pages/Home.tsx` (the "Industry" role card is now live and links to
  `/industry/login`, alongside Student, University, and Government).

### Bug fixed during merge
- `pages/industry/IProblems.tsx` had its own hardcoded, partial copy of the
  domain-filter list, missing `Public Facilities`, `Housing`, and
  `Communication` — problems in those domains could never be found via the
  filter. This is the exact class of bug already documented and fixed once
  in `citizen/constants/domains.ts` ("there must be exactly ONE domain
  list"). Fixed by importing the canonical list from there instead of
  maintaining a second copy.

### Database
- **`database/industry_portal.sql` is a new, separate, purely-additive
  script** — same pattern as `student_portal.sql` / `university_portal.sql` /
  `government_portal.sql`. It only creates `industries`, `industry_otps`,
  `industry_problem_adoptions`, and `industry_solution_reviews`; it never
  touches, alters, or drops any existing table. All statements are
  idempotent, so re-running it is safe.

### Verified working
- `cd backend && npm install && npx tsc --noEmit` → 0 real errors (only a
  pre-existing, harmless `tsconfig` deprecation notice about
  `moduleResolution`, present before this merge too).
- `cd frontend && npm install && npx tsc -b` → 0 errors.

### Setup addition
```bash
psql "$DATABASE_URL" -f database/industry_portal.sql
```
Run this in addition to the four migrations already listed below. No new
environment variables or npm dependencies were introduced.

---

## Earlier merge — Student + University + Government portal

This section documents the merge that combined two previously-separate
branches of CivicSolve AI:

- **Student + University/Faculty/Teams portal** (original base)
- **Government portal** (merged in)

Both shared the same student-portal core but had each independently modified
some of the same files. Below is exactly what changed and why, plus what to
run to get it working.

## What changed

### Backend (`backend/src`)
- **Added** (government-only, no conflicts): `controllers/govAuthController.ts`,
  `controllers/govController.ts`, `middleware/govAuthMiddleware.ts`,
  `routes/govAuthRoutes.ts`, `routes/govRoutes.ts`, `types/government.ts`,
  `seed_gov_user.js` (dev helper to create a test government login).
- **Merged** (both branches had touched these):
  - `app.ts` — mounts both `/api/university`, `/api/teams`, `/api/guidance`
    **and** `/api/gov/auth`, `/api/gov`. CORS now allows both dev ports
    (5173/5174) plus `CLIENT_URL`.
  - `utils/jwt.ts` — `signToken`/`verifyToken` now accept both the existing
    student/university payload shapes and the new `GovJwtPayload`.
  - `services/otpService.ts` — made table-agnostic (`tableName` param,
    defaults to `student_otps` so all existing calls are unaffected).
    Government OTPs use `government_otps`. University OTPs still use their
    own separate `services/universityOtpService.ts`, untouched.
  - `services/aiPipelineClient.ts` — kept everything from the
    student/university branch and added the government branch's
    `getExecutiveBrief()` / `analyzeTrends()` methods.

### Frontend (`frontend/src`)
- **Added**: `pages/gov/*`, `components/gov/*`, `context/GovAuthContext.tsx`,
  `services/govApi.ts`, `govAuthService.ts`, `govProblemService.ts`,
  `govService.ts`, `types/government.ts`.
- **Merged**: `App.tsx` (all three auth providers + all three route trees),
  `pages/Home.tsx` (the "Government" role card is now live and links to
  `/government/login`, alongside Student and University).
- Everything else (Dashboard, ProblemCard, Sidebar, Problems, ProblemDetails,
  problemService, types/student) came from the student/university branch,
  which already had a superset of features (problem-ID search, teams panel,
  etc.) — the government branch hadn't diverged on those files.

### Database
- **`database/government_portal.sql` is a new, separate, purely-additive
  script** — same pattern as the existing `student_portal.sql` /
  `university_portal.sql`. It only creates `government_users`,
  `government_otps`, and `government_actions`; it never touches, alters, or
  drops any existing table.
- `student_portal.sql` and `university_portal.sql` are **unchanged**.

### AI pipeline — untouched, as requested
The two uploads contained *different* versions of `ai-pipeline/main.py`.
This merge uses the **student/university branch's version as-is**
(it has connection pooling and taxonomy validation the other version
lacked). That means the `/executive-brief` and `/analyze-trends` HTTP
endpoints the government branch's `main.py` added are **not** present here.

This does not break anything: `govController.getAiBrief()` already wraps
the call in a try/catch and falls back to a manual-assessment placeholder
if the AI pipeline call fails or the endpoint doesn't exist. So the
Government AI Brief panel will work, it just won't be a live LLM-generated
brief until/unless those two endpoints are ported into this ai-pipeline
version — say the word if you want that done as a follow-up.

## Verified working
- `cd backend && npm install && npx tsc --noEmit` → 0 errors
- `cd frontend && npm install && npx tsc --noEmit && npm run build` → 0 errors,
  production build succeeds

## Setup

```bash
# 1. Database — run all three migrations (idempotent, safe to re-run)
psql "$DATABASE_URL" -f database/student_portal.sql
psql "$DATABASE_URL" -f database/university_portal.sql
psql "$DATABASE_URL" -f database/additional_features.sql
psql "$DATABASE_URL" -f database/government_portal.sql
psql "$DATABASE_URL" -f database/industry_portal.sql

# 2. Backend
cd backend
npm install
npm run build   # or npm run dev
npm start

# 3. Frontend
cd frontend
npm install
npm run dev

# 4. (Optional) Create a test government login for local testing
cd backend
node seed_gov_user.js
# creates gov.test@civicsolve.in / GovTest@123
```

`.env` files for both `backend` and `frontend` were carried over from your
uploads as-is (they already contain working DB/JWT/email settings) — no new
environment variables were needed since both branches' `package.json` files
were identical (no new npm dependencies were introduced by the merge).

## Routes reference

| Portal | Public | Protected (after login) |
|---|---|---|
| Student | `/student/login`, `/student/register`, `/student/verify-otp` | `/student/dashboard`, `/student/problems`, `/student/my-teams`, `/student/faculty`, ... |
| University | `/university/login`, `/university/register` | `/university/dashboard`, `/university/students`, `/university/faculty` |
| Government | `/government/login`, `/government/register` | `/government/dashboard`, `/government/problems`, `/government/problems/map`, `/government/problems/:id`, `/government/profile` |
| Industry | `/industry/login`, `/industry/register`, `/industry/verify-otp` | `/industry/dashboard`, `/industry/problems`, `/industry/problems/:id`, `/industry/adoptions` |
