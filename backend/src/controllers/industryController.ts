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

// GET /api/industry/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, company_name, email, domain, contact_person, designation, phone, sector, city, state, website, email_verified, created_at, updated_at
     FROM industries WHERE id = $1`,
    [req.industryId]
  );
  if (rows.length === 0) throw new AppError("Industry profile not found.", 404);
  return res.json({ success: true, industry: rows[0] });
});

// GET /api/industry/dashboard
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const industryId = req.industryId as number;

  const { rows: indRows } = await query(
    `SELECT company_name, sector, domain FROM industries WHERE id = $1`,
    [industryId]
  );
  if (indRows.length === 0) throw new AppError("Industry profile not found.", 404);
  const companySector = indRows[0].sector;

  // Total problems registered on the platform
  const { rows: totalProblemsRows } = await query(`SELECT COUNT(*)::int AS count FROM reports`);

  // Problems relevant to industry's sector/domain (ILIKE or exact match)
  const { rows: sectorProblemsRows } = await query(
    `SELECT COUNT(*)::int AS count FROM reports WHERE domain ILIKE $1 OR $2 ILIKE '%' || domain || '%'`,
    [`%${companySector}%`, companySector]
  );

  // Student solutions available across platform (completed or with solution text)
  const { rows: solutionsAvailableRows } = await query(
    `SELECT COUNT(*)::int AS count FROM student_problems WHERE solution_text IS NOT NULL AND TRIM(solution_text) != ''`
  );

  // Active adoptions by this industry
  const { rows: myAdoptionsCountRows } = await query(
    `SELECT COUNT(*)::int AS count FROM industry_problem_adoptions WHERE industry_id = $1`,
    [industryId]
  );

  // Total budget/commitment by this industry
  const { rows: commitmentsRows } = await query(
    `SELECT COALESCE(SUM(budget_estimate), 0)::numeric AS total_grants
     FROM industry_problem_adoptions WHERE industry_id = $1`,
    [industryId]
  );

  // Status breakdown of this industry's adoptions
  const { rows: adoptionsBreakdown } = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM industry_problem_adoptions
     WHERE industry_id = $1
     GROUP BY status`,
    [industryId]
  );

  // Recent adoptions by this company
  const { rows: recentAdoptions } = await query(
    `SELECT ipa.id, ipa.commitment_type, ipa.status, ipa.budget_estimate, ipa.created_at,
            r.id AS problem_id, r.problem_title, r.domain, r.severity
     FROM industry_problem_adoptions ipa
     JOIN reports r ON r.id = ipa.problem_id
     WHERE ipa.industry_id = $1
     ORDER BY ipa.updated_at DESC
     LIMIT 5`,
    [industryId]
  );

  // Recent student solutions ready for industry review
  const { rows: recentSolutions } = await query(
    `SELECT sp.id AS student_problem_id, sp.solution_text, sp.solution_submitted_at, sp.status,
            s.name AS student_name, s.college, s.branch,
            r.id AS problem_id, r.problem_title, r.domain, r.severity,
            (SELECT COUNT(*) FROM industry_solution_reviews isr WHERE isr.student_problem_id = sp.id)::int AS review_count
     FROM student_problems sp
     JOIN students s ON s.id = sp.student_id
     JOIN reports r ON r.id = sp.problem_id
     WHERE sp.solution_text IS NOT NULL AND TRIM(sp.solution_text) != ''
     ORDER BY sp.solution_submitted_at DESC NULLS LAST, sp.updated_at DESC
     LIMIT 6`
  );

  return res.json({
    success: true,
    industry: indRows[0],
    stats: {
      totalProblems: totalProblemsRows[0].count,
      sectorProblems: sectorProblemsRows[0].count,
      solutionsAvailable: solutionsAvailableRows[0].count,
      activeAdoptions: myAdoptionsCountRows[0].count,
      totalGrants: Number(commitmentsRows[0].total_grants),
      adoptionsBreakdown,
    },
    recentAdoptions,
    recentSolutions,
  });
});

// GET /api/industry/problems
export const getIndustryProblems = asyncHandler(async (req: Request, res: Response) => {
  const { domain, severity, hasSolutions, search } = req.query;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (domain && typeof domain === "string" && domain !== "ALL") {
    params.push(domain);
    conditions.push(`r.domain = $${params.length}`);
  }

  if (severity && typeof severity === "string" && severity !== "ALL") {
    params.push(severity);
    conditions.push(`LOWER(r.severity) = LOWER($${params.length})`);
  }

  if (search && typeof search === "string" && search.trim().length > 0) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(r.problem_title ILIKE $${params.length} OR r.problem_description ILIKE $${params.length})`);
  }

  if (hasSolutions === "true") {
    conditions.push(`EXISTS (
      SELECT 1 FROM student_problems sp
      WHERE sp.problem_id = r.id AND sp.solution_text IS NOT NULL AND TRIM(sp.solution_text) != ''
    )`);
  }

  let sql = `
    SELECT
      r.id,
      r.problem_title,
      r.problem_description,
      r.domain,
      r.responsible_fields,
      r.severity,
      r.confidence,
      r.locations,
      COALESCE(pr.report_count, 0)::int AS report_count,
      COALESCE(sol.solution_count, 0)::int AS solution_count,
      COALESCE(sol.working_students, 0)::int AS working_students,
      COALESCE(adp.adoption_count, 0)::int AS industry_adoptions_count,
      EXISTS (
        SELECT 1 FROM industry_problem_adoptions ipa
        WHERE ipa.problem_id = r.id AND ipa.industry_id = $${params.length + 1}
      ) AS adopted_by_me
    FROM reports r
    LEFT JOIN (
      SELECT problem_id, COUNT(*) AS report_count FROM problem_reports GROUP BY problem_id
    ) pr ON pr.problem_id = r.id
    LEFT JOIN (
      SELECT
        problem_id,
        COUNT(*) FILTER (WHERE solution_text IS NOT NULL AND TRIM(solution_text) != '') AS solution_count,
        COUNT(*) AS working_students
      FROM student_problems
      GROUP BY problem_id
    ) sol ON sol.problem_id = r.id
    LEFT JOIN (
      SELECT problem_id, COUNT(*) AS adoption_count FROM industry_problem_adoptions GROUP BY problem_id
    ) adp ON adp.problem_id = r.id
  `;

  params.push(req.industryId);

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` ORDER BY ${SEVERITY_ORDER}, solution_count DESC, r.id DESC`;

  const { rows } = await query(sql, params);

  return res.json({ success: true, problems: rows });
});

// GET /api/industry/problems/:id
export const getProblemDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const industryId = req.industryId as number;

  const { rows: problemRows } = await query(
    `SELECT
       r.id,
       r.problem_title,
       r.problem_description,
       r.domain,
       r.responsible_fields,
       r.severity,
       r.confidence,
       r.locations,
       r.image_path,
       r.image_description,
       COALESCE(pr.report_count, 0)::int AS report_count
     FROM reports r
     LEFT JOIN (
       SELECT problem_id, COUNT(*) AS report_count FROM problem_reports GROUP BY problem_id
     ) pr ON pr.problem_id = r.id
     WHERE r.id = $1`,
    [id]
  );

  if (problemRows.length === 0) throw new AppError("Problem not found.", 404);

  // Check if current industry adopted this problem
  const { rows: adoptionRows } = await query(
    `SELECT * FROM industry_problem_adoptions WHERE industry_id = $1 AND problem_id = $2`,
    [industryId, id]
  );

  // Other industry adoptions
  const { rows: otherAdoptions } = await query(
    `SELECT ipa.id, ipa.commitment_type, ipa.status, ipa.created_at, ind.company_name, ind.sector
     FROM industry_problem_adoptions ipa
     JOIN industries ind ON ind.id = ipa.industry_id
     WHERE ipa.problem_id = $1`,
    [id]
  );

  // Student solutions and attempts for this problem
  const { rows: studentSolutions } = await query(
    `SELECT
       sp.id AS student_problem_id,
       sp.status,
       sp.joined_at,
       sp.solution_text,
       sp.solution_submitted_at,
       s.id AS student_id,
       s.name AS student_name,
       s.college,
       s.branch,
       s.year_of_study,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', isr.id,
               'rating', isr.rating,
               'review_text', isr.review_text,
               'pilot_interest', isr.pilot_interest,
               'company_name', ind.company_name,
               'created_at', isr.created_at
             )
           )
           FROM industry_solution_reviews isr
           JOIN industries ind ON ind.id = isr.industry_id
           WHERE isr.student_problem_id = sp.id
         ),
         '[]'::json
       ) AS reviews
     FROM student_problems sp
     JOIN students s ON s.id = sp.student_id
     WHERE sp.problem_id = $1
     ORDER BY (sp.solution_text IS NOT NULL AND TRIM(sp.solution_text) != '') DESC, sp.joined_at DESC`,
    [id]
  );

  // Student teams working on this problem. Invite codes are never
  // exposed here — they're private to team members (see item 11 of
  // the team-security requirements).
  const { rows: teamsRows } = await query(
    `SELECT
       t.id, t.name, t.max_members, t.created_at,
       s.name AS leader_name,
       COUNT(tm.id)::int AS member_count,
       EXISTS (
         SELECT 1 FROM industry_problem_adoptions ipa
         WHERE ipa.industry_id = $2 AND ipa.problem_id = $1
       ) AS can_message
     FROM teams t
     JOIN students s ON s.id = t.created_by
     LEFT JOIN team_members tm ON tm.team_id = t.id
     WHERE t.problem_id = $1
     GROUP BY t.id, t.name, t.max_members, t.created_at, s.name`,
    [id, industryId]
  );

  return res.json({
    success: true,
    problem: problemRows[0],
    myAdoption: adoptionRows.length > 0 ? adoptionRows[0] : null,
    allAdoptions: otherAdoptions,
    studentSolutions,
    teams: teamsRows,
  });
});

// POST /api/industry/problems/:id/adopt
export const adoptProblem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const industryId = req.industryId as number;
  const { commitmentType, notes, budgetEstimate } = req.body;

  const VALID_COMMITMENT_TYPES = ["MENTORSHIP", "PILOT_FUNDING", "HARDWARE_RESOURCES", "FIELD_DEPLOYMENT"];
  if (!commitmentType || !VALID_COMMITMENT_TYPES.includes(commitmentType)) {
    throw new AppError("Invalid commitment type. Must be MENTORSHIP, PILOT_FUNDING, HARDWARE_RESOURCES, or FIELD_DEPLOYMENT.", 400);
  }

  const { rows: problemRows } = await query(`SELECT id FROM reports WHERE id = $1`, [id]);
  if (problemRows.length === 0) throw new AppError("Problem not found.", 404);

  const { rows: existing } = await query(
    `SELECT id FROM industry_problem_adoptions WHERE industry_id = $1 AND problem_id = $2`,
    [industryId, id]
  );

  if (existing.length > 0) {
    // Update existing adoption
    const { rows: updated } = await query(
      `UPDATE industry_problem_adoptions
       SET commitment_type = $1,
           notes = $2,
           budget_estimate = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [commitmentType, notes || null, Number(budgetEstimate) || 0, existing[0].id]
    );
    return res.json({ success: true, message: "Problem adoption details updated.", adoption: updated[0] });
  }

  const { rows } = await query(
    `INSERT INTO industry_problem_adoptions (industry_id, problem_id, commitment_type, status, notes, budget_estimate)
     VALUES ($1, $2, $3, 'EVALUATING', $4, $5)
     RETURNING *`,
    [industryId, id, commitmentType, notes || null, Number(budgetEstimate) || 0]
  );

  return res.status(201).json({
    success: true,
    message: "Problem successfully adopted! You can now coordinate pilot implementation and student mentorship.",
    adoption: rows[0],
  });
});

// GET /api/industry/adoptions
export const getMyAdoptions = asyncHandler(async (req: Request, res: Response) => {
  const industryId = req.industryId as number;

  const { rows } = await query(
    `SELECT
       ipa.id,
       ipa.commitment_type,
       ipa.status,
       ipa.notes,
       ipa.budget_estimate,
       ipa.created_at,
       ipa.updated_at,
       r.id AS problem_id,
       r.problem_title,
       r.domain,
       r.responsible_fields,
       r.severity,
       COALESCE(pr.report_count, 0)::int AS report_count,
       COALESCE(sol.solution_count, 0)::int AS solution_count
     FROM industry_problem_adoptions ipa
     JOIN reports r ON r.id = ipa.problem_id
     LEFT JOIN (
       SELECT problem_id, COUNT(*) AS report_count FROM problem_reports GROUP BY problem_id
     ) pr ON pr.problem_id = r.id
     LEFT JOIN (
       SELECT problem_id, COUNT(*) FILTER (WHERE solution_text IS NOT NULL AND TRIM(solution_text) != '') AS solution_count
       FROM student_problems
       GROUP BY problem_id
     ) sol ON sol.problem_id = r.id
     WHERE ipa.industry_id = $1
     ORDER BY ipa.updated_at DESC`,
    [industryId]
  );

  return res.json({ success: true, adoptions: rows });
});

// PATCH /api/industry/adoptions/:id
export const updateAdoptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const industryId = req.industryId as number;
  const { status, notes, budgetEstimate } = req.body;

  const VALID_STATUSES = ["EVALUATING", "ACTIVE", "PILOT_DEPLOYED", "RESOLVED"];
  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError("Invalid status. Must be EVALUATING, ACTIVE, PILOT_DEPLOYED, or RESOLVED.", 400);
  }

  const { rows: existing } = await query(
    `SELECT * FROM industry_problem_adoptions WHERE id = $1 AND industry_id = $2`,
    [id, industryId]
  );

  if (existing.length === 0) throw new AppError("Adoption record not found.", 404);

  const current = existing[0];
  const newStatus = status || current.status;
  const newNotes = notes !== undefined ? notes : current.notes;
  const newBudget = budgetEstimate !== undefined ? Number(budgetEstimate) : current.budget_estimate;

  const { rows } = await query(
    `UPDATE industry_problem_adoptions
     SET status = $1, notes = $2, budget_estimate = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND industry_id = $5
     RETURNING *`,
    [newStatus, newNotes, newBudget, id, industryId]
  );

  return res.json({
    success: true,
    message: `Adoption status updated to ${newStatus}.`,
    adoption: rows[0],
  });
});

// POST /api/industry/solutions/:studentProblemId/review
export const submitSolutionReview = asyncHandler(async (req: Request, res: Response) => {
  const { studentProblemId } = req.params;
  const industryId = req.industryId as number;
  const { reviewText, rating, pilotInterest } = req.body;

  if (!reviewText || typeof reviewText !== "string" || reviewText.trim().length < 10) {
    throw new AppError("Please provide technical feedback of at least 10 characters.", 400);
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5.", 400);
  }

  const { rows: spRows } = await query(
    `SELECT id, problem_id FROM student_problems WHERE id = $1`,
    [studentProblemId]
  );
  if (spRows.length === 0) throw new AppError("Student solution record not found.", 404);

  const { rows } = await query(
    `INSERT INTO industry_solution_reviews (industry_id, student_problem_id, review_text, rating, pilot_interest)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (industry_id, student_problem_id)
     DO UPDATE SET
       review_text = EXCLUDED.review_text,
       rating = EXCLUDED.rating,
       pilot_interest = EXCLUDED.pilot_interest,
       created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [industryId, studentProblemId, reviewText.trim(), numRating, Boolean(pilotInterest)]
  );

  return res.status(201).json({
    success: true,
    message: "Solution review submitted successfully.",
    review: rows[0],
  });
});
