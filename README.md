# CivicSolve AI — Student Portal

A standalone Student Portal module for the existing **CivicSolve AI** project. It consumes the
already-populated `reports` table (produced by your existing AI pipeline) and does **not** modify
or replace any of that logic — this project only adds:

- `students`, `student_otps`, `student_problems`, `problem_reports` tables
- A Node.js/Express/TypeScript REST API
- A React/Vite/TypeScript frontend

---

## 1. Requirements

- Node.js 18+ and npm
- PostgreSQL 14+ with the CivicSolve AI database already running and containing the `reports` table
- A Gmail account (or any SMTP provider) for sending OTP emails

---

## 2. What to install

Nothing needs to be installed globally. Each half of the project has its own `package.json` —
running `npm install` in `backend/` and `frontend/` pulls in everything (Express, pg, bcrypt,
jsonwebtoken, nodemailer, React, Vite, Tailwind, Leaflet, react-leaflet, etc).

---

## 3. PostgreSQL database setup

The migration is at `database/student_portal.sql`. It only **adds** tables — it never touches,
alters, or drops `reports`.

```bash
psql "$DATABASE_URL" -f database/student_portal.sql
```

or

```bash
psql -U postgres -d civicsolve -f database/student_portal.sql
```

Verify:

```sql
\dt
-- should list: reports, students, student_otps, student_problems, problem_reports
```

**Important:** `problem_reports` is what the `report_count` ("Reported by X citizens") on every
problem is calculated from — it's not derived from `locations`. Until your citizen-submission
pipeline inserts a row into `problem_reports` for every incoming report (in addition to
creating/updating the `reports` row), `report_count` will show `0`. This portal only reads that
table; the insert has to happen wherever citizen submissions are currently processed.

---

## 4. Environment variables

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in:

```
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/civicsolve
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d
EMAIL_USER=preethampusala18@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
CLIENT_URL=http://localhost:5173
```

`EMAIL_PASSWORD` must be a Gmail **App Password** (not your normal Gmail password) — generate one
under Google Account → Security → App Passwords, with 2FA enabled on the account.

If `EMAIL_USER`/`EMAIL_PASSWORD` are left blank, the backend will **not** fail — it logs the OTP to
the server console instead, so you can still test the flow locally without email configured.

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

---

## 5. Backend installation

```bash
cd backend
npm install
```

---

## 6. Frontend installation

```bash
cd frontend
npm install
```

---

## 7. How to start backend

```bash
cd backend
npm run dev
```

Runs on `http://localhost:5000`. Check `http://localhost:5000/api/health` for a JSON OK response.

---

## 8. How to start frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:5173`.

---

## 9. How to test registration

1. Open `http://localhost:5173/register`.
2. Fill in Name, Email, Password, Confirm Password, College, Branch, Year, Phone, City.
3. Click **Send OTP**. Check your inbox (or the backend console log if email isn't configured).
4. Enter the 6-digit code on the verify screen and submit.
5. You're redirected to `/login` with the account created.

---

## 10. How to test login

1. Go to `http://localhost:5173/login`.
2. Enter the email/password you just registered.
3. You're redirected to `/dashboard` with a JWT stored client-side.

---

## 11. How to test the student dashboard

1. After login, `/dashboard` fetches `GET /api/problems/relevant`, filtered by your branch against
   `reports.responsible_fields`, and `GET /api/students/my-problems`.
2. Click **Take Problem** on any card — it inserts into `student_problems` and the button updates.
3. Visit `/problems`, `/problems/map`, `/my-problems`, `/profile` to exercise the rest of the flow.
4. On `/my-problems`, advance a problem's status (`INTERESTED → WORKING → COMPLETED`).

If `/dashboard` shows an empty state, it means no row in `reports` currently has your branch inside
its `responsible_fields` array — that's expected on a fresh dataset, not a bug.

---

## 12. Civic network dashboard and staged citizen intake

The root route (`/`) is now the public CivicSolve dashboard. It gives citizens a direct **Report a problem** path, a no-login **Find a problem** catalog, and a role-access panel for Student, University, Industry, and Government. Student access is active; the other three roles are displayed as planned future portals.

The public catalog is available at `/find-problem` and calls `GET /api/public/problems`. It is read-only and exposes problem statements without requiring authentication. Each statement has a **Want to work on this?** action that routes to the student login.

Citizen reporting now uses two explicit API stages:

| Endpoint | Purpose |
|---|---|
| `POST /api/citizen/problems/preview` | Translate and run the non-persisting AI preview; returns an editable generated title, statement, domain, severity, responsible fields, and duplicate-awareness status. |
| `POST /api/citizen/problems/confirm` | Persists only after the citizen confirms the edited draft; the final AI classification and deduplication pipeline then runs. |
| `POST /api/citizen/problems` | Backwards-compatible alias for the confirmed-submit path. |

The AI client uses a shorter preview timeout and warm-model settings. `AI_PREVIEW_TIMEOUT_MS` defaults to 10 seconds and `AI_PIPELINE_TIMEOUT_MS` defaults to 18 seconds. The maintained `ai-pipeline/k7_final2.py` also uses deterministic, bounded generation and `keep_alive` settings to reduce repeated model startup and verbose output latency.

---

## 13. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend exits immediately with "DATABASE_URL is not set" | `.env` missing in `backend/`, or wrong path |
| Backend exits with "JWT_SECRET is not set" | Same — check `backend/.env` |
| `ECONNREFUSED` on backend start | PostgreSQL isn't running, or `DATABASE_URL` points to the wrong host/port |
| OTP email never arrives | Check backend console — if `EMAIL_USER`/`EMAIL_PASSWORD` aren't set, the OTP is logged there instead of emailed. If they are set, confirm it's a Gmail **App Password**, not your login password |
| "Invalid email or password" on login right after registering | Confirm the OTP step actually completed (check `students` table for the row, `email_verified` should be `TRUE`) |
| Dashboard/Problems pages are empty | Your branch string doesn't currently match any `reports.responsible_fields` entry — that's a data issue, not a portal bug. Query `SELECT DISTINCT unnest(responsible_fields) FROM reports;` to see what values exist |
| `report_count` shows 0 for every problem | Nothing is inserting into `problem_reports` yet — see section 3 |
| CORS error in browser console | `CLIENT_URL` in `backend/.env` doesn't match the URL the frontend is actually running on |
| 401 right after login | JWT_SECRET differs between the token that was issued and what the server currently uses (e.g. you changed `.env` and didn't restart) |

---

## Project structure

```
civicsolve-student-portal/
  backend/
    src/
      config/database.ts        Postgres pool
      controllers/               authController, studentController, problemController
      routes/                    authRoutes, studentRoutes, problemRoutes
      middleware/                authMiddleware (JWT), errorMiddleware, rateLimiter
      services/                  otpService, emailService
      utils/                     jwt, password/otp hashing, asyncHandler, AppError
      app.ts / server.ts
    .env.example
  frontend/
    src/
      components/                Sidebar, Header, Layout, ProblemCard, ProblemMap, SeverityBadge, etc.
      pages/                     Login, Register, VerifyOtp, Dashboard, Problems, ProblemDetails,
                                  ProblemsMap, MyProblems, Profile
      services/                  api.ts (axios + auth header), authService, studentService, problemService
      context/                   AuthContext, ToastContext
      types/
    .env.example
  database/
    student_portal.sql           Migration for students/student_otps/student_problems/problem_reports
```

## API summary

```
POST   /api/auth/send-otp
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/students/me
PUT    /api/students/me
PUT    /api/students/change-password
GET    /api/students/my-problems
PATCH  /api/students/my-problems/:id

GET    /api/problems/relevant
GET    /api/problems/:id
GET    /api/problems/map
POST   /api/problems/:id/join
```

All `/api/students/*` and `/api/problems/*` routes require `Authorization: Bearer <token>`.

---

## 14. University Portal (new)

A second, separate portal for universities/colleges to register, verify their **official
institutional email** (must end in `.edu.in`), log in, and see engagement stats for their
own students — without touching the student side at all.

Run the extra migration once (in addition to `student_portal.sql`):

```bash
psql "$DATABASE_URL" -f database/university_portal.sql
```

This adds `universities`, `university_otps`, `teams`, `team_members`, and a nullable
`university_id` column on `students`. A student is automatically linked to a university the
moment their email domain matches a registered university's verified `.edu.in` domain
(checked at student registration, and retroactively for existing students the moment a
university with that domain registers).

**Routes**

```
POST   /api/university/auth/send-otp
POST   /api/university/auth/register     (rejects any email not ending in .edu.in)
POST   /api/university/auth/login
POST   /api/university/auth/logout

GET    /api/university/me
GET    /api/university/dashboard         (students registered, universities on the
                                           platform, universities actively working
                                           problems, per-problem breakdown, teams)
GET    /api/university/students
```

**Frontend pages**: `/university/register`, `/university/verify-otp`, `/university/login`,
`/university/dashboard`, `/university/students`. The "University" card on the home page now
links straight into this flow instead of showing "Coming soon".

## 15. Teams (new)

Students can form a team around a specific problem and invite classmates with a short
invite code, instead of solving everything solo.

```
POST   /api/teams              { name, problemId }   -> creates a team, you become LEADER
POST   /api/teams/join         { inviteCode }         -> joins an existing team
GET    /api/teams/mine                                -> teams you belong to
GET    /api/teams/problem/:problemId                  -> all teams working a given problem
DELETE /api/teams/:id/leave                           -> leave (or disband if you're the
                                                          only member)
```

A "Teams working on this problem" panel appears on every problem's detail page, and
students have a new **My Teams** entry in the sidebar.

## 16. Finding a problem by name, not just by ID (new)

`GET /api/problems/search?q=...` does a title/description search so a student who doesn't
know a problem's numeric ID can look it up. It's wired into:

- The **Track a complaint** box on the student dashboard (type a name, pick from the
  dropdown, and it tracks that problem automatically).
- The **Problems** page, as a "Search by name" box above the domain/severity filters.
- Every problem card and the problem detail page now display the **Problem ID** clearly, so
  students can note it down for tracking later.

## 17. Industry ⇄ Student Team Messaging (new)

Once an industry partner adopts a civic problem, they can message the student team(s)
working on it directly, and students can reply — a lightweight chat thread, not a full
inbox system. Access is gated on adoption: an industry can only message teams working on
a problem it has actually adopted, and only members of a team can see or send that team's
messages.

Run the extra migration once (after `student_portal.sql` and `industry_portal.sql`):

```bash
psql "$DATABASE_URL" -f database/industry_messaging.sql
```

This adds a single `industry_team_messages` table (no changes to any existing table).

```
GET    /api/industry/messages                              -> industry's conversation list
                                                                 (one row per team, unread counts)
GET    /api/industry/messages/:teamId                       -> thread with a team, marks it read
POST   /api/industry/messages/:teamId       { message }     -> send a message to the team

GET    /api/teams/:teamId/industry-conversations            -> team's conversation list
                                                                 (one row per adopting industry)
GET    /api/teams/:teamId/industry-conversations/:industryId -> thread with an industry, marks it read
POST   /api/teams/:teamId/industry-conversations/:industryId { message } -> send a message
```

Every new message triggers an email to the other side (team members, or the industry's
contact email) via the existing email service — so students find out about industry
updates even when they aren't actively checking the app. The acting sender is never
emailed their own message.

**Frontend**: a new **Messages** page in the Industry Portal (`/industry/messages`), and an
**Industry Messages** button on each team card in the Student Portal's **My Teams** page —
both show unread badges and a simple two-way chat thread.
