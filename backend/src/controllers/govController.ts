import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { comparePassword, hashPassword } from "../utils/password";
import { VALID_DEPARTMENTS, VALID_DESIGNATIONS, VALID_ACTION_TYPES, VALID_GOV_REVIEW_STATUSES } from "../types/government";
import { aiPipelineClient } from "../services/aiPipelineClient";

// GET /api/gov/me
export const getGovMe = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, name, email, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified, created_at, updated_at
     FROM government_users WHERE id = $1`,
    [req.govId]
  );

  if (rows.length === 0) {
    throw new AppError("Government user not found.", 404);
  }

  return res.json({ success: true, user: rows[0] });
});

// PUT /api/gov/me
export const updateGovMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, designation, jurisdiction_city, jurisdiction_state, phone } = req.body;

  if (designation && !VALID_DESIGNATIONS.includes(designation)) {
    throw new AppError("Invalid designation selected.", 400);
  }

  const { rows } = await query(
    `UPDATE government_users
     SET name = COALESCE(NULLIF($1, ''), name),
         designation = COALESCE(NULLIF($2, ''), designation),
         jurisdiction_city = COALESCE(NULLIF($3, ''), jurisdiction_city),
         jurisdiction_state = COALESCE(NULLIF($4, ''), jurisdiction_state),
         phone = COALESCE(NULLIF($5, ''), phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, name, email, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified, created_at, updated_at`,
    [name, designation, jurisdiction_city, jurisdiction_state, phone, req.govId]
  );

  if (rows.length === 0) {
    throw new AppError("Government user not found.", 404);
  }

  return res.json({ success: true, user: rows[0] });
});

// PUT /api/gov/change-password
export const changeGovPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError("All password fields are required.", 400);
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError("New passwords do not match.", 400);
  }

  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long.", 400);
  }

  const { rows } = await query(`SELECT password_hash FROM government_users WHERE id = $1`, [req.govId]);
  if (rows.length === 0) {
    throw new AppError("Government user not found.", 404);
  }

  const isMatch = await comparePassword(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    throw new AppError("Current password is incorrect.", 401);
  }

  const newHash = await hashPassword(newPassword);
  await query(
    `UPDATE government_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newHash, req.govId]
  );

  return res.json({ success: true, message: "Password updated successfully." });
});

const getDepartmentDomains = (department: string): string[] => {
  switch (department) {
    case 'Public Works': return ['Road Infrastructure', 'Public Facilities', 'Housing'];
    case 'Water Supply': return ['Water Supply', 'Water Quality'];
    case 'Sanitation': return ['Sanitation', 'Waste Management'];
    case 'Transportation': return ['Public Transport', 'Traffic Management'];
    case 'Urban Planning': return ['Housing', 'Public Facilities'];
    case 'Health': return ['Healthcare'];
    case 'Education': return ['Education'];
    case 'Environment': return ['Environment', 'Pollution'];
    case 'Energy & Power': return ['Energy', 'Public Lighting'];
    default: return [department];
  }
};

// GET /api/gov/dashboard/stats
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  
  const department = userRows[0].department;
  const domains = getDepartmentDomains(department);
  
  const totalProblemsQuery = await query(`SELECT COUNT(*) as count FROM reports WHERE domain = ANY($1) AND gov_review_status != 'DISCARDED'`, [domains]);
  const highPriorityQuery = await query(`SELECT COUNT(*) as count FROM reports WHERE domain = ANY($1) AND severity IN ('Critical', 'High') AND gov_review_status != 'DISCARDED'`, [domains]);
  const actionsTakenQuery = await query(`SELECT COUNT(*) as count FROM government_actions WHERE gov_user_id = $1`, [req.govId]);
  const problemsResolvedQuery = await query(`SELECT COUNT(*) as count FROM government_actions WHERE gov_user_id = $1 AND action_type = 'RESOLVED'`, [req.govId]);
  const pendingApprovalQuery = await query(`SELECT COUNT(*) as count FROM reports WHERE domain = ANY($1) AND gov_review_status = 'PENDING_REVIEW'`, [domains]);

  return res.json({
    success: true,
    stats: {
      total_problems: parseInt(totalProblemsQuery.rows[0].count),
      high_priority: parseInt(highPriorityQuery.rows[0].count),
      actions_taken: parseInt(actionsTakenQuery.rows[0].count),
      problems_resolved: parseInt(problemsResolvedQuery.rows[0].count),
      pending_approval: parseInt(pendingApprovalQuery.rows[0].count),
    }
  });
});

// GET /api/gov/problems/pending
// The priority-sorted approval queue: problems the AI pipeline judged
// worth a human look (priority_score above the discard threshold) but
// that have not yet been approved or rejected by any official. These are
// NOT visible to the student portal until approved here.
export const getPendingGovProblems = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { rows } = await query(
    `SELECT r.*,
        COALESCE((SELECT COUNT(*) FROM problem_reports pr WHERE pr.problem_id = r.id), 0)::int AS report_count,
        COALESCE(jsonb_array_length(r.locations), 0)::int AS location_count
     FROM reports r
     WHERE r.domain = ANY($1) AND r.gov_review_status = 'PENDING_REVIEW'
     ORDER BY r.priority_score DESC, r.created_at ASC`,
    [domains]
  );

  return res.json({ success: true, problems: rows });
});

// POST /api/gov/problems/:id/approve
// Approving is what makes a problem visible to the student/university
// portals — before this, it only ever exists inside the government portal.
export const approveGovProblem = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id } = req.params;
  const { remarks } = req.body as { remarks?: string };

  const { rows: probRows } = await query(
    `SELECT id, gov_review_status FROM reports WHERE id = $1 AND domain = ANY($2)`,
    [id, domains]
  );
  if (probRows.length === 0) throw new AppError("Problem not found or out of jurisdiction", 404);
  if (probRows[0].gov_review_status === 'DISCARDED') {
    throw new AppError("This problem was auto-discarded as low-priority and cannot be approved.", 400);
  }

  const { rows } = await query(
    `UPDATE reports
     SET gov_review_status = 'GOV_APPROVED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_remarks = $2
     WHERE id = $3
     RETURNING *`,
    [req.govId, remarks || null, id]
  );

  await query(
    `INSERT INTO gov_access_log (gov_user_id, problem_id, action) VALUES ($1, $2, 'APPROVE_PROBLEM')`,
    [req.govId, id]
  );

  return res.json({ success: true, problem: rows[0], message: "Problem approved and is now visible to students and universities." });
});

// POST /api/gov/problems/:id/reject
export const rejectGovProblem = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id } = req.params;
  const { remarks } = req.body as { remarks?: string };

  if (!remarks || remarks.trim().length < 5) {
    throw new AppError("A short reason (at least 5 characters) is required to reject a problem.", 400);
  }

  const { rows: probRows } = await query(`SELECT id FROM reports WHERE id = $1 AND domain = ANY($2)`, [id, domains]);
  if (probRows.length === 0) throw new AppError("Problem not found or out of jurisdiction", 404);

  const { rows } = await query(
    `UPDATE reports
     SET gov_review_status = 'GOV_REJECTED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_remarks = $2
     WHERE id = $3
     RETURNING *`,
    [req.govId, remarks.trim(), id]
  );

  await query(
    `INSERT INTO gov_access_log (gov_user_id, problem_id, action) VALUES ($1, $2, 'REJECT_PROBLEM')`,
    [req.govId, id]
  );

  return res.json({ success: true, problem: rows[0], message: "Problem rejected. It will not be shown to students." });
});

// GET /api/gov/problems
export const getGovProblems = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  
  const department = userRows[0].department;
  const domains = getDepartmentDomains(department);

  const { severity, domain, actionStatus, reviewStatus } = req.query;
  
  let q = `
    SELECT r.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', ga.id, 'action_type', ga.action_type, 'created_at', ga.created_at) ORDER BY ga.created_at DESC)
         FROM government_actions ga WHERE ga.problem_id = r.id),
        '[]'
      ) as actions
    FROM reports r
    WHERE r.domain = ANY($1)
  `;
  const params: any[] = [domains];
  let paramIdx = 2;

  if (severity) {
    q += ` AND r.severity = $${paramIdx++}`;
    params.push(severity);
  }
  
  if (domain) {
    q += ` AND r.domain = $${paramIdx++}`;
    params.push(domain);
  }

  if (actionStatus) {
    q += ` AND r.status = $${paramIdx++}`;
    params.push(actionStatus);
  } else {
    // Default to active cases only
    q += ` AND r.status IN ('OPEN', 'IN_PROGRESS')`;
  }

  if (reviewStatus && typeof reviewStatus === "string" && VALID_GOV_REVIEW_STATUSES.includes(reviewStatus as any)) {
    q += ` AND r.gov_review_status = $${paramIdx++}`;
    params.push(reviewStatus);
  } else {
    // By default, never show auto-discarded (low-priority/noise) reports
    // in the main problems list — they live only in the audit trail.
    q += ` AND r.gov_review_status != 'DISCARDED'`;
  }

  q += ` ORDER BY r.priority_score DESC, r.created_at DESC`;

  const { rows } = await query(q, params);
  return res.json({ success: true, problems: rows });
});

// GET /api/gov/problems/:id
export const getGovProblemById = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id } = req.params;
  
  const { rows } = await query(`
    SELECT r.*, 
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', ga.id, 
          'action_type', ga.action_type, 
          'remarks', ga.remarks,
          'budget_estimate', ga.budget_estimate,
          'timeline_days', ga.timeline_days,
          'created_at', ga.created_at,
          'official_name', gu.name,
          'official_designation', gu.designation
         ) ORDER BY ga.created_at DESC)
         FROM government_actions ga
         JOIN government_users gu ON ga.gov_user_id = gu.id
         WHERE ga.problem_id = r.id),
        '[]'
      ) as actions
    FROM reports r
    WHERE r.id = $1 AND r.domain = ANY($2)
  `, [id, domains]);
  
  if (rows.length === 0) {
    throw new AppError("Problem not found or out of jurisdiction", 404);
  }
  
  return res.json({ success: true, problem: rows[0] });
});

// POST /api/gov/problems/:id/action
export const createGovAction = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id: problem_id } = req.params;
  const { action_type, remarks, budget_estimate, timeline_days } = req.body;
  
  if (!VALID_ACTION_TYPES.includes(action_type)) {
    throw new AppError("Invalid action type", 400);
  }
  
  if (!remarks || remarks.trim().length < 10) {
    throw new AppError("Remarks must be at least 10 characters", 400);
  }

  // Domain check
  const { rows: probRows } = await query(`SELECT id FROM reports WHERE id = $1 AND domain = ANY($2)`, [problem_id, domains]);
  if (probRows.length === 0) throw new AppError("Problem not found or out of jurisdiction", 404);

  const { rows } = await query(`
    INSERT INTO government_actions (gov_user_id, problem_id, action_type, remarks, budget_estimate, timeline_days)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [req.govId, problem_id, action_type, remarks, budget_estimate || null, timeline_days || null]);

  const TERMINAL: Record<string, string> = {
    RESOLVED: 'RESOLVED',
    DISMISSED_FAKE: 'DISMISSED_FAKE',
    DISMISSED_DUPLICATE: 'DISMISSED_DUPLICATE',
    CLOSED_EXTERNAL: 'CLOSED_EXTERNAL',
  };
  
  if (TERMINAL[action_type]) {
    await query(
      `UPDATE reports SET status = $1, status_reason = $2, status_set_by = $3, status_set_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [TERMINAL[action_type], remarks, req.govId, problem_id]
    );
  }

  return res.json({ success: true, action: rows[0] });
});

// GET /api/gov/problems/:id/actions
export const getGovProblemActions = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id } = req.params;
  
  const { rows: probRows } = await query(`SELECT id FROM reports WHERE id = $1 AND domain = ANY($2)`, [id, domains]);
  if (probRows.length === 0) throw new AppError("Problem not found or out of jurisdiction", 404);

  const { rows } = await query(`
    SELECT ga.*, gu.name as official_name, gu.designation as official_designation, gu.department as official_department
    FROM government_actions ga
    JOIN government_users gu ON ga.gov_user_id = gu.id
    WHERE ga.problem_id = $1
    ORDER BY ga.created_at DESC
  `, [id]);
  
  return res.json({ success: true, actions: rows });
});

// GET /api/gov/problems/:id/ai-brief
export const getAiBrief = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id } = req.params;
  const { regenerate } = req.query;
  
  const { rows } = await query(`SELECT * FROM reports WHERE id = $1 AND domain = ANY($2)`, [id, domains]);
  if (rows.length === 0) {
    throw new AppError("Problem not found or out of jurisdiction", 404);
  }
  
  const problem = rows[0];

  // Return cached brief if available and not regenerating
  if (problem.ai_brief && regenerate !== 'true') {
    await query(
      `INSERT INTO gov_access_log (gov_user_id, problem_id, action) VALUES ($1, $2, 'VIEW_AI_BRIEF')`,
      [req.govId, id]
    );
    return res.json({ success: true, brief: problem.ai_brief, generated_at: problem.ai_brief_generated_at });
  }
  
  try {
    const brief = await aiPipelineClient.getExecutiveBrief({
      problem_title: problem.problem_title || 'Unknown Title',
      problem_description: problem.problem_description || problem.description_original || '',
      domain: problem.domain,
      severity: problem.severity,
      report_count: problem.report_count,
      location_count: problem.location_count || 1,
      responsible_fields: problem.responsible_fields || []
    });
    
    // Cache the result
    await query(
      `UPDATE reports SET ai_brief = $1, ai_brief_generated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [JSON.stringify(brief), id]
    );

    await query(
      `INSERT INTO gov_access_log (gov_user_id, problem_id, action) VALUES ($1, $2, 'VIEW_AI_BRIEF')`,
      [req.govId, id]
    );

    return res.json({ success: true, brief, generated_at: new Date() });
  } catch (error) {
    console.error("AI Brief error:", error);
    if (problem.ai_brief) {
      return res.json({ success: true, brief: problem.ai_brief, generated_at: problem.ai_brief_generated_at, from_cache_due_to_error: true });
    }
    // Graceful fallback
    return res.json({ 
      success: true, 
      brief: {
        impact_assessment: "AI Service temporarily unavailable. Manual assessment required.",
        recommended_actions: ["Investigate the reported issue", "Coordinate with local teams", "Allocate necessary budget"],
        resource_estimate: "Pending manual evaluation",
        priority_score: problem.severity === 'Critical' ? 90 : problem.severity === 'High' ? 75 : 50
      } 
    });
  }
});

// GET /api/gov/problems/:id/students
export const getGovProblemStudents = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id } = req.params;
  const { rows: probRows } = await query(`SELECT id FROM reports WHERE id = $1 AND domain = ANY($2)`, [id, domains]);
  if (probRows.length === 0) throw new AppError("Problem not found or out of jurisdiction", 404);

  const { rows } = await query(`
    SELECT 
      sp.student_id,
      s.name,
      s.college,
      s.branch,
      s.year_of_study,
      sp.status,
      sp.joined_at,
      sp.solution_text,
      CASE WHEN sp.share_contact THEN s.email ELSE null END as email,
      CASE WHEN sp.share_contact THEN s.phone ELSE null END as phone
    FROM student_problems sp
    JOIN students s ON sp.student_id = s.id
    WHERE sp.problem_id = $1 AND sp.removed_by_gov = FALSE
  `, [id]);

  await query(
    `INSERT INTO gov_access_log (gov_user_id, problem_id, action) VALUES ($1, $2, 'VIEW_STUDENT_LIST')`,
    [req.govId, id]
  );

  return res.json({ success: true, students: rows.map(r => ({
    studentId: r.student_id,
    name: r.name,
    college: r.college,
    branch: r.branch,
    yearOfStudy: r.year_of_study,
    status: r.status,
    joinedAt: r.joined_at,
    solutionText: r.solution_text,
    contact: r.email || r.phone ? { email: r.email, phone: r.phone } : null
  }))});
});

// DELETE /api/gov/problems/:id/students/:studentId
export const removeGovProblemStudent = asyncHandler(async (req: Request, res: Response) => {
  const { rows: userRows } = await query(`SELECT department FROM government_users WHERE id = $1`, [req.govId]);
  if (userRows.length === 0) throw new AppError("User not found", 404);
  const domains = getDepartmentDomains(userRows[0].department);

  const { id, studentId } = req.params;
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
    throw new AppError("A removal reason of at least 10 characters is required.", 400);
  }

  const { rows: probRows } = await query(`SELECT id FROM reports WHERE id = $1 AND domain = ANY($2)`, [id, domains]);
  if (probRows.length === 0) throw new AppError("Problem not found or out of jurisdiction", 404);

  const { rows } = await query(`
    UPDATE student_problems 
    SET removed_by_gov = TRUE, removal_reason = $1 
    WHERE problem_id = $2 AND student_id = $3 AND removed_by_gov = FALSE
    RETURNING id
  `, [reason.trim(), id, studentId]);

  if (rows.length === 0) {
    throw new AppError("Student assignment not found or already removed.", 404);
  }

  await query(
    `INSERT INTO gov_access_log (gov_user_id, problem_id, student_id, action) VALUES ($1, $2, $3, 'REMOVE_STUDENT')`,
    [req.govId, id, studentId]
  );

  return res.json({ success: true, message: "Student has been removed from this case." });
});
