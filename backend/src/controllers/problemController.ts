import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

const SEVERITY_ORDER = `
  CASE LOWER(r.severity)
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END
`;

const getStudentBranch = async (studentId: number): Promise<string> => {
  const { rows } = await query(`SELECT branch FROM students WHERE id = $1`, [studentId]);
  if (rows.length === 0) throw new AppError("Student not found.", 404);
  return rows[0].branch;
};

const PROBLEM_SELECT = `
  SELECT
    r.id,
    r.problem_title,
    r.problem_description,
    r.domain,
    r.responsible_fields,
    r.severity,
    r.confidence,
    r.image_path,
    r.image_description,
    r.locations,
    r.priority_score,
    COALESCE(pr.report_count, 0)::int AS report_count,
    COALESCE(jsonb_array_length(r.locations), 0)::int AS location_count
  FROM reports r
  LEFT JOIN (
    SELECT problem_id, COUNT(*) AS report_count
    FROM problem_reports
    GROUP BY problem_id
  ) pr ON pr.problem_id = r.id
  WHERE r.gov_review_status = 'GOV_APPROVED'
`;
// NOTE: every problem the student portal (and the public catalog) can see
// must have passed the government review gate. A problem only reaches
// gov_review_status = 'GOV_APPROVED' after a government official has
// explicitly approved it in the government portal — before that it's
// either still PENDING_REVIEW (visible only to government) or was
// auto-DISCARDED by the AI pipeline as low priority. All call sites below
// add further conditions with "AND", never a second "WHERE".

// GET /api/problems/relevant
export const getRelevantProblems = asyncHandler(async (req: Request, res: Response) => {
  const branch = await getStudentBranch(req.studentId as number);

  const { rows } = await query(
    `${PROBLEM_SELECT}
     AND $1 = ANY(r.responsible_fields)
     ORDER BY ${SEVERITY_ORDER}, report_count DESC, r.id DESC`,
    [branch]
  );

  return res.json({ success: true, studentBranch: branch, problems: rows });
});

// GET /api/problems/search?q=...
// Lets a student find a problem's ID by typing its name/title when they
// don't already know the numeric ID — powers a search dropdown.
export const searchProblems = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  const term = typeof q === "string" ? q.trim() : "";

  if (term.length < 2) {
    return res.json({ success: true, results: [] });
  }

  const { rows } = await query(
    `SELECT
       r.id,
       r.problem_title,
       r.domain,
       r.severity,
       COALESCE(pr.report_count, 0)::int AS report_count
     FROM reports r
     LEFT JOIN (
       SELECT problem_id, COUNT(*) AS report_count FROM problem_reports GROUP BY problem_id
     ) pr ON pr.problem_id = r.id
     WHERE r.gov_review_status = 'GOV_APPROVED'
       AND (r.problem_title ILIKE $1 OR r.problem_description ILIKE $1)
     ORDER BY ${SEVERITY_ORDER}, report_count DESC
     LIMIT 8`,
    [`%${term}%`]
  );

  return res.json({ success: true, results: rows });
});

// GET /api/problems/:id
export const getProblemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { rows } = await query(`${PROBLEM_SELECT} AND r.id = $1`, [id]);

  if (rows.length === 0) {
    throw new AppError("Problem not found.", 404);
  }

  // Include this student's status on the problem, if they've taken it
  const { rows: joinRows } = await query(
    `SELECT status FROM student_problems WHERE student_id = $1 AND problem_id = $2`,
    [req.studentId, id]
  );

  return res.json({
    success: true,
    problem: rows[0],
    myStatus: joinRows.length > 0 ? joinRows[0].status : null,
  });
});

// GET /api/problems/map
export const getProblemsForMap = asyncHandler(async (req: Request, res: Response) => {
  const branch = await getStudentBranch(req.studentId as number);
  const { domain, severity, status, allBranches } = req.query;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (allBranches !== "true") {
    params.push(branch);
    conditions.push(`$${params.length} = ANY(r.responsible_fields)`);
  }

  if (domain && typeof domain === "string") {
    params.push(domain);
    conditions.push(`r.domain = $${params.length}`);
  }

  if (severity && typeof severity === "string") {
    params.push(severity);
    conditions.push(`LOWER(r.severity) = LOWER($${params.length})`);
  }

  let sql = PROBLEM_SELECT;
  if (conditions.length > 0) {
    sql += ` AND ${conditions.join(" AND ")}`;
  }
  sql += ` ORDER BY ${SEVERITY_ORDER}, report_count DESC`;

  const { rows } = await query(sql, params);

  let problems = rows;

  // Optional status filter (INTERESTED/WORKING/COMPLETED) requires joining student_problems
  if (status && typeof status === "string") {
    const { rows: statusRows } = await query(
      `SELECT problem_id FROM student_problems WHERE student_id = $1 AND status = $2`,
      [req.studentId, status]
    );
    const idsWithStatus = new Set(statusRows.map((r: any) => r.problem_id));
    problems = problems.filter((p: any) => idsWithStatus.has(p.id));
  }

  return res.json({ success: true, studentBranch: branch, problems });
});

// GET /api/public/problems
// Public read-only catalog: exposes problem statements only; student actions remain protected below.
export const getPublicProblems = asyncHandler(async (_req: Request, res: Response) => {
  const { rows } = await query(
    `${PROBLEM_SELECT}
     ORDER BY ${SEVERITY_ORDER}, report_count DESC, r.id DESC`
  );

  return res.json({ success: true, problems: rows });
});

// POST /api/problems/:id/join
export const joinProblem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { rows: problemRows } = await query(
    `SELECT id FROM reports WHERE id = $1 AND gov_review_status = 'GOV_APPROVED'`,
    [id]
  );
  if (problemRows.length === 0) {
    throw new AppError("Problem not found.", 404);
  }

  const { rows: existing } = await query(
    `SELECT id, status FROM student_problems WHERE student_id = $1 AND problem_id = $2`,
    [req.studentId, id]
  );

  if (existing.length > 0) {
    return res.status(200).json({
      success: true,
      alreadyJoined: true,
      message: "You have already taken this problem.",
      studentProblem: existing[0],
    });
  }

  const { rows } = await query(
    `INSERT INTO student_problems (student_id, problem_id, status)
     VALUES ($1, $2, 'INTERESTED')
     RETURNING id, student_id, problem_id, status, joined_at, updated_at`,
    [req.studentId, id]
  );

  return res.status(201).json({
    success: true,
    alreadyJoined: false,
    message: "Problem added to My Problems.",
    studentProblem: rows[0],
  });
});

// GET /api/students/my-problems
export const getMyProblems = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT
       sp.id AS student_problem_id,
       sp.status,
       sp.joined_at,
       sp.updated_at,
       sp.solution_text,
       sp.solution_submitted_at,
       r.id AS problem_id,
       r.problem_title,
       r.domain,
       r.responsible_fields,
       r.severity,
       COALESCE(prc.report_count, 0)::int AS report_count,
       COALESCE(jsonb_array_length(r.locations), 0)::int AS location_count
     FROM student_problems sp
     JOIN reports r ON r.id = sp.problem_id
     LEFT JOIN (
       SELECT problem_id, COUNT(*) AS report_count FROM problem_reports GROUP BY problem_id
     ) prc ON prc.problem_id = r.id
     WHERE sp.student_id = $1
     ORDER BY sp.updated_at DESC`,
    [req.studentId]
  );

  return res.json({ success: true, myProblems: rows });
});

// PATCH /api/students/my-problems/:id
export const updateMyProblemStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, solutionText } = req.body;
  const VALID_STATUSES = ["INTERESTED", "WORKING", "COMPLETED"];
  if (!VALID_STATUSES.includes(status)) throw new AppError("Invalid status value.", 400);
  if (status === "COMPLETED" && (typeof solutionText !== "string" || solutionText.trim().length < 10)) {
    throw new AppError("Please describe how you solved the problem in at least 10 characters.", 400);
  }
  const { rows } = await query(
    `UPDATE student_problems
     SET status = $1,
         solution_text = CASE WHEN $1 = 'COMPLETED' THEN $4 ELSE solution_text END,
         solution_submitted_at = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE solution_submitted_at END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND student_id = $3
     RETURNING id, student_id, problem_id, status, joined_at, updated_at, solution_text, solution_submitted_at`,
    [status, id, req.studentId, typeof solutionText === "string" ? solutionText.trim() : null]
  );
  if (rows.length === 0) throw new AppError("Problem record not found.", 404);
  return res.json({ success: true, studentProblem: rows[0] });
});
// DELETE /api/students/my-problems/:id
export const removeMyProblem = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `DELETE FROM student_problems WHERE id = $1 AND student_id = $2 RETURNING id`,
    [req.params.id, req.studentId]
  );
  if (rows.length === 0) throw new AppError("Problem record not found.", 404);
  return res.json({ success: true, message: "Problem removed from My Problems." });
});

// GET /api/problems/:id/tracking
export const getProblemTracking = asyncHandler(async (req: Request, res: Response) => {
  const { rows: problemRows } = await query(`SELECT id FROM reports WHERE id = $1`, [req.params.id]);
  if (problemRows.length === 0) throw new AppError("Problem not found.", 404);
  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*) FROM problem_reports WHERE problem_id = $1)::int AS report_count,
       (SELECT COUNT(*) FROM student_problems WHERE problem_id = $1 AND status IN ('INTERESTED','WORKING'))::int AS students_solving,
       (SELECT COUNT(*) FROM student_problems WHERE problem_id = $1 AND status = 'COMPLETED')::int AS students_completed`,
    [req.params.id]
  );
  return res.json({ success: true, problemId: Number(req.params.id), ...rows[0] });
});
