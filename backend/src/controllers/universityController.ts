import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// GET /api/university/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, name, email, domain, contact_person, phone, city, state, email_verified, created_at, updated_at
     FROM universities WHERE id = $1`,
    [req.universityId]
  );
  if (rows.length === 0) throw new AppError("University not found.", 404);
  return res.json({ success: true, university: rows[0] });
});

// GET /api/university/dashboard
// Headline stats for the university's own control-room view.
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const universityId = req.universityId as number;

  const { rows: uniRows } = await query(`SELECT name, domain FROM universities WHERE id = $1`, [universityId]);
  if (uniRows.length === 0) throw new AppError("University not found.", 404);

  // How many students registered under this university's verified email domain.
  const { rows: studentCountRows } = await query(
    `SELECT COUNT(*)::int AS count FROM students WHERE university_id = $1`,
    [universityId]
  );

  // Platform-wide stat: how many universities are on CivicSolve at all —
  // shown so a university can see the size of the network it has joined.
  const { rows: platformUniRows } = await query(`SELECT COUNT(*)::int AS count FROM universities`);

  // How many distinct universities (across the whole platform) have at
  // least one student actively working a civic problem right now.
  const { rows: activeUniRows } = await query(
    `SELECT COUNT(DISTINCT s.university_id)::int AS count
     FROM student_problems sp
     JOIN students s ON s.id = sp.student_id
     WHERE s.university_id IS NOT NULL`
  );

  // Problems this university's own students are currently engaged with,
  // plus how many OTHER universities are also working the same problem —
  // gives a sense of cross-institution collaboration/competition per problem.
  const { rows: problemsWorkedRows } = await query(
    `SELECT
       r.id,
       r.problem_title,
       r.domain,
       r.severity,
       COUNT(DISTINCT sp.student_id) FILTER (WHERE s.university_id = $1)::int AS our_students,
       COUNT(DISTINCT s.university_id)::int AS universities_working
     FROM student_problems sp
     JOIN students s ON s.id = sp.student_id
     JOIN reports r ON r.id = sp.problem_id
     WHERE r.id IN (
       SELECT DISTINCT problem_id FROM student_problems sp2
       JOIN students s2 ON s2.id = sp2.student_id
       WHERE s2.university_id = $1 
     )
     GROUP BY r.id, r.problem_title, r.domain, r.severity
     ORDER BY our_students DESC
     LIMIT 20`,
    [universityId]
  );

  const { rows: statusBreakdownRows } = await query(
    `SELECT sp.status, COUNT(*)::int AS count
     FROM student_problems sp
     JOIN students s ON s.id = sp.student_id
     WHERE s.university_id = $1
     GROUP BY sp.status`,
    [universityId]
  );

  const { rows: teamCountRows } = await query(
    `SELECT COUNT(DISTINCT t.id)::int AS count
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     JOIN students s ON s.id = tm.student_id
     WHERE s.university_id = $1`,
    [universityId]
  );

  const { rows: recentStudents } = await query(
    `SELECT id, name, email, branch, year_of_study, created_at
     FROM students WHERE university_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [universityId]
  );

  return res.json({
    success: true,
    university: uniRows[0],
    stats: {
      studentsRegistered: studentCountRows[0].count,
      universitiesOnPlatform: platformUniRows[0].count,
      universitiesActivelyWorking: activeUniRows[0].count,
      teamsFromThisUniversity: teamCountRows[0].count,
      statusBreakdown: statusBreakdownRows,
    },
    problemsWorked: problemsWorkedRows,
    recentStudents,
  });
});

// GET /api/university/students
export const getUniversityStudents = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, name, email, college, branch, year_of_study, city, created_at
     FROM students WHERE university_id = $1
     ORDER BY created_at DESC`,
    [req.universityId]
  );
  return res.json({ success: true, students: rows });
});
